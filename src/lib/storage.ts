import { Quotation, Service, AppSettings, UserAccount, PaymentTransaction } from './types';
import { DEFAULT_SERVICES, DEFAULT_SETTINGS, DEFAULT_INCLUSIONS } from './defaults';
import { getTodayDateString } from './utils';
import { generateSecureId } from './crypto';

const STORAGE_KEYS = {
  QUOTATIONS: 'snap_service_persistent_quotations_v2',
  DELETED_IDS: 'snap_service_deleted_quotation_ids',
  SERVICES: 'snap_service_services',
  SETTINGS: 'snap_service_settings',
  USERS: 'snap_service_users',
  CURRENT_USER: 'snap_service_current_user',
};

// Seed Users: Super Admin (Owner) + Default Staff User
export const SEED_USERS: UserAccount[] = [
  {
    id: 'user-super-admin',
    name: 'Zunair Ahmad (Owner)',
    email: 'admin@snapservice.com',
    password: 'admin123',
    phone: '0323-9244924',
    role: 'super_admin',
    approved: true,
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-staff-1',
    name: 'Staff Photographer',
    email: 'staff@snapservice.com',
    password: 'staff123',
    phone: '0300-1234567',
    role: 'user',
    approved: true,
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const storage = {
  // Persistent Offline-First Quotations CRUD
  getQuotations: (): Quotation[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUOTATIONS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      const deletedIds = storage.getDeletedIds();
      return parsed.filter((q: Quotation) => {
        const idMatch = q.id && deletedIds.has(q.id.toLowerCase());
        const numMatch = q.quotationNumber && deletedIds.has(q.quotationNumber.toLowerCase());
        return !idMatch && !numMatch;
      });
    } catch (e) {
      console.error('Error reading quotations from localStorage', e);
      return [];
    }
  },

  setAllQuotations: (quotations: Quotation[]): void => {
    if (typeof window === 'undefined') return;
    try {
      const deletedIds = storage.getDeletedIds();
      const cleanList = (quotations || []).filter((q) => {
        const idMatch = q.id && deletedIds.has(q.id.toLowerCase());
        const numMatch = q.quotationNumber && deletedIds.has(q.quotationNumber.toLowerCase());
        return !idMatch && !numMatch;
      });
      localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(cleanList));
    } catch (e) {
      console.error('Error writing quotations to localStorage', e);
    }
  },

  getDeletedIds: (): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DELETED_IDS);
      if (!data) return new Set();
      const arr = JSON.parse(data);
      return new Set(Array.isArray(arr) ? arr.map((s: string) => String(s).toLowerCase()) : []);
    } catch {
      return new Set();
    }
  },

  addDeletedId: (id: string, quotationNumber?: string): void => {
    if (typeof window === 'undefined' || !id) return;
    try {
      const set = storage.getDeletedIds();
      set.add(id.trim().toLowerCase());
      if (quotationNumber) set.add(quotationNumber.trim().toLowerCase());
      localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(Array.from(set)));
    } catch {}
  },

  removeDeletedId: (id: string): void => {
    if (typeof window === 'undefined' || !id) return;
    try {
      const set = storage.getDeletedIds();
      set.delete(id.trim().toLowerCase());
      localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(Array.from(set)));
    } catch {}
  },

  getQuotationById: (id: string): Quotation | null => {
    if (!id) return null;
    const cleanId = id.trim().toLowerCase();
    const all = storage.getQuotations();
    return (
      all.find(
        (q) =>
          (q.id && q.id.toLowerCase() === cleanId) ||
          (q.quotationNumber && q.quotationNumber.toLowerCase() === cleanId)
      ) || null
    );
  },

  saveQuotationLocally: (quotation: Quotation): Quotation => {
    if (typeof window === 'undefined' || !quotation) return quotation;
    try {
      if (quotation.id) storage.removeDeletedId(quotation.id);
      if (quotation.quotationNumber) storage.removeDeletedId(quotation.quotationNumber);

      const all = storage.getQuotations();
      const idx = all.findIndex((q) => q.id === quotation.id);
      let updated: Quotation[];
      if (idx >= 0) {
        updated = [...all];
        updated[idx] = quotation;
      } else {
        updated = [quotation, ...all];
      }
      storage.setAllQuotations(updated);
    } catch (e) {
      console.error('Error saving quotation locally', e);
    }
    return quotation;
  },

  saveQuotation: (quotation: Quotation): Quotation => {
    return storage.saveQuotationLocally(quotation);
  },

  deleteQuotation: (id: string): void => {
    if (typeof window === 'undefined' || !id) return;
    const cleanKey = id.trim().toLowerCase();
    try {
      const all = storage.getQuotations();
      const target = all.find(
        (q) => (q.id && q.id.toLowerCase() === cleanKey) || (q.quotationNumber && q.quotationNumber.toLowerCase() === cleanKey)
      );
      const filtered = all.filter(
        (q) =>
          q.id.toLowerCase() !== cleanKey &&
          (!q.quotationNumber || q.quotationNumber.toLowerCase() !== cleanKey)
      );
      storage.addDeletedId(cleanKey, target?.quotationNumber);
      if (target?.id) storage.addDeletedId(target.id);
      localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(filtered));
    } catch (e) {
      console.error('Error deleting quotation from localStorage', e);
    }
  },

  duplicateQuotation: (id: string): Quotation | null => {
    const target = storage.getQuotationById(id);
    if (!target) return null;

    const nextNum = storage.generateQuotationNumber();

    const newQuotation: Quotation = {
      ...target,
      id: generateSecureId('quote'),
      quotationNumber: nextNum,
      client: {
        ...target.client,
        name: `${target.client.name} (Copy)`,
      },
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return storage.saveQuotation(newQuotation);
  },

  // Service Library CRUD
  getServices: (): Service[] => {
    if (typeof window === 'undefined') return DEFAULT_SERVICES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
        return DEFAULT_SERVICES;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading services from localStorage', e);
      return DEFAULT_SERVICES;
    }
  },

  saveServices: (services: Service[]): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
      storage.triggerAutoBackup();
    }
  },

  // Settings CRUD (Per-User Studio Configurations)
  getSettings: (targetUserId?: string): AppSettings => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const currentUser = storage.getCurrentUser();
      const userId = targetUserId || currentUser?.id || 'default';
      const userKey = `${STORAGE_KEYS.SETTINGS}_${userId}`;
      const data = localStorage.getItem(userKey);

      if (!data) {
        // Fallback to global default settings if user key doesn't exist yet
        const globalData = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (globalData) {
          const parsed = JSON.parse(globalData);
          localStorage.setItem(userKey, JSON.stringify(parsed));
          return parsed;
        }
        localStorage.setItem(userKey, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Error reading per-user settings from localStorage', e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings: (settings: AppSettings, targetUserId?: string): void => {
    if (typeof window !== 'undefined') {
      const currentUser = storage.getCurrentUser();
      const userId = targetUserId || currentUser?.id || 'default';
      const userKey = `${STORAGE_KEYS.SETTINGS}_${userId}`;
      localStorage.setItem(userKey, JSON.stringify(settings));
      storage.triggerAutoBackup();
    }
  },

  // Auto-generate next quotation number with strict sequence increment
  generateQuotationNumber: (): string => {
    const settings = storage.getSettings();
    const quotations = storage.getQuotations();
    let maxSeq = settings.quotation.startingNumber - 1;

    quotations.forEach((q) => {
      if (q.quotationNumber) {
        const parts = q.quotationNumber.split('-');
        const numStr = parts[parts.length - 1];
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    });

    const nextNumber = maxSeq + 1;
    return `${settings.quotation.prefix}-${nextNumber}`;
  },

  // User Accounts CRUD & Session Management
  getUsers: (): UserAccount[] => {
    if (typeof window === 'undefined') return SEED_USERS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
        return SEED_USERS;
      }
      const parsed: UserAccount[] = JSON.parse(data);
      const hasSuperAdmin = parsed.some((u) => u.role === 'super_admin');
      if (!hasSuperAdmin) {
        parsed.unshift(SEED_USERS[0]);
      }
      return parsed;
    } catch {
      return SEED_USERS;
    }
  },

  saveUser: (user: UserAccount): UserAccount => {
    const list = storage.getUsers();
    const idx = list.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    let updated: UserAccount[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = { ...updated[idx], ...user };
    } else {
      updated = [user, ...list];
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      storage.triggerAutoBackup();
    }
    return user;
  },

  deleteUser: (id: string): void => {
    const list = storage.getUsers();
    const updated = list.filter((u) => u.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      storage.triggerAutoBackup();
    }
  },

  getCurrentUser: (): UserAccount | null => {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  },

  setCurrentUser: (user: UserAccount | null): void => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    }
  },

  // Complete System Backup & Restore Engine
  createBackupData: () => {
    if (typeof window === 'undefined') return null;
    return {
      appName: 'The Snap Service',
      version: '2.0',
      timestamp: new Date().toISOString(),
      quotations: storage.getQuotations(),
      services: storage.getServices(),
      settings: storage.getSettings(),
      users: storage.getUsers(),
    };
  },

  triggerAutoBackup: () => {
    if (typeof window === 'undefined') return;
    try {
      const backupData = storage.createBackupData();
      if (backupData) {
        localStorage.setItem('snap_service_auto_backup_latest', JSON.stringify(backupData));
        localStorage.setItem('snap_service_last_auto_backup_time', new Date().toISOString());
      }
    } catch (e) {
      console.error('Error creating auto-backup', e);
    }
  },

  getLastAutoBackupTime: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('snap_service_last_auto_backup_time');
  },

  restoreFromBackupData: (backupObj: Record<string, unknown> | null | undefined): boolean => {
    if (typeof window === 'undefined' || !backupObj) return false;
    try {
      if (backupObj.quotations && Array.isArray(backupObj.quotations)) {
        for (const q of backupObj.quotations) {
          try {
            fetch('/api/quotations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(q),
            }).catch(() => {});
          } catch {}
        }
      }
      if (backupObj.services && Array.isArray(backupObj.services)) {
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(backupObj.services));
      }
      if (backupObj.users && Array.isArray(backupObj.users)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(backupObj.users));
      }
      if (backupObj.settings) {
        const currentUser = storage.getCurrentUser();
        const userId = currentUser?.id || 'default';
        const userKey = `${STORAGE_KEYS.SETTINGS}_${userId}`;
        localStorage.setItem(userKey, JSON.stringify(backupObj.settings));
      }
      storage.triggerAutoBackup();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('snap_quotation_updated'));
      }
      return true;
    } catch (e) {
      console.error('Error restoring backup data', e);
      return false;
    }
  },
  recordPaymentTransaction: (quotationId: string, transaction: PaymentTransaction): Quotation | null => {
    const q = storage.getQuotationById(quotationId);
    if (!q) return null;

    const existingTx = q.payment?.transactions || [];
    const updatedTx = [...existingTx, transaction];
    const totalPaid = updatedTx.reduce((sum, t) => sum + (t.amount || 0), 0);
    const grandTotal = q.payment?.grandTotal || 0;
    const balance = Math.max(0, grandTotal - totalPaid);

    let status: 'unpaid' | 'partially_paid' | 'paid_in_full' = 'unpaid';
    if (totalPaid >= grandTotal && grandTotal > 0) status = 'paid_in_full';
    else if (totalPaid > 0) status = 'partially_paid';

    const updatedQuotation: Quotation = {
      ...q,
      payment: {
        ...q.payment,
        advanceReceived: totalPaid,
        balancePayable: balance,
        transactions: updatedTx,
        paymentStatus: status,
      },
      updatedAt: new Date().toISOString(),
    };

    storage.saveQuotationLocally(updatedQuotation);
    return updatedQuotation;
  },

  updatePaymentTransaction: (
    quotationId: string,
    transactionId: string,
    updatedFields: Partial<PaymentTransaction>
  ): Quotation | null => {
    const q = storage.getQuotationById(quotationId);
    if (!q) return null;

    const existingTx = q.payment?.transactions || [];
    const updatedTx = existingTx.map((t) => (t.id === transactionId ? { ...t, ...updatedFields } : t));
    const totalPaid = updatedTx.reduce((sum, t) => sum + (t.amount || 0), 0);
    const grandTotal = q.payment?.grandTotal || 0;
    const balance = Math.max(0, grandTotal - totalPaid);

    let status: 'unpaid' | 'partially_paid' | 'paid_in_full' = 'unpaid';
    if (totalPaid >= grandTotal && grandTotal > 0) status = 'paid_in_full';
    else if (totalPaid > 0) status = 'partially_paid';

    const updatedQuotation: Quotation = {
      ...q,
      payment: {
        ...q.payment,
        advanceReceived: totalPaid,
        balancePayable: balance,
        transactions: updatedTx,
        paymentStatus: status,
      },
      updatedAt: new Date().toISOString(),
    };

    storage.saveQuotationLocally(updatedQuotation);
    return updatedQuotation;
  },

  deletePaymentTransaction: (quotationId: string, transactionId: string): Quotation | null => {
    const q = storage.getQuotationById(quotationId);
    if (!q) return null;

    const existingTx = q.payment?.transactions || [];
    const updatedTx = existingTx.filter((t) => t.id !== transactionId);
    const totalPaid = updatedTx.reduce((sum, t) => sum + (t.amount || 0), 0);
    const grandTotal = q.payment?.grandTotal || 0;
    const balance = Math.max(0, grandTotal - totalPaid);

    let status: 'unpaid' | 'partially_paid' | 'paid_in_full' = 'unpaid';
    if (totalPaid >= grandTotal && grandTotal > 0) status = 'paid_in_full';
    else if (totalPaid > 0) status = 'partially_paid';

    const updatedQuotation: Quotation = {
      ...q,
      payment: {
        ...q.payment,
        advanceReceived: totalPaid,
        balancePayable: balance,
        transactions: updatedTx,
        paymentStatus: status,
      },
      updatedAt: new Date().toISOString(),
    };

    storage.saveQuotationLocally(updatedQuotation);
    return updatedQuotation;
  },
};
