import { Quotation, Service, AppSettings, UserAccount } from './types';
import { DEFAULT_SERVICES, DEFAULT_SETTINGS, DEFAULT_INCLUSIONS } from './defaults';
import { getTodayDateString } from './utils';
import { generateSecureId } from './crypto';

const STORAGE_KEYS = {
  QUOTATIONS: 'snap_service_quotations',
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

// Sample seed quotation so the app is immediately visual and ready to test
const SEED_QUOTATIONS: Quotation[] = [
  {
    id: 'quote-seed-1',
    quotationNumber: 'SS-2026-101',
    userId: 'user-super-admin',
    status: 'sent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    client: {
      name: 'Hassan & Zara',
      phone: '+92 321 9876543',
      quotationDate: getTodayDateString(),
      eventDates: '15th Oct - 18th Oct 2026',
    },
    packageType: 'multi_event',
    events: [
      {
        id: 'evt-1',
        name: 'Nikkah',
        dayNumber: 1,
        services: [
          { id: 'es-1', serviceId: 'srv-1', serviceName: 'Photographer', quantity: 1 },
          { id: 'es-2', serviceId: 'srv-2', serviceName: 'Videographer', quantity: 1 },
          { id: 'es-3', serviceId: 'srv-13', serviceName: 'Full Event Coverage', quantity: 1 },
        ],
        guestCount: 80,
        price: 35000,
      },
      {
        id: 'evt-2',
        name: 'Mehndi',
        dayNumber: 2,
        services: [
          { id: 'es-4', serviceId: 'srv-1', serviceName: 'Photographer', quantity: 2 },
          { id: 'es-5', serviceId: 'srv-2', serviceName: 'Videographer', quantity: 1 },
          { id: 'es-6', serviceId: 'srv-3', serviceName: 'Drone', quantity: 1 },
        ],
        guestCount: 150,
        price: 45000,
      },
      {
        id: 'evt-3',
        name: 'Barat',
        dayNumber: 3,
        services: [
          { id: 'es-7', serviceId: 'srv-1', serviceName: 'Photographer', quantity: 2 },
          { id: 'es-8', serviceId: 'srv-2', serviceName: 'Videographer', quantity: 2 },
          { id: 'es-9', serviceId: 'srv-3', serviceName: 'Drone', quantity: 1 },
          { id: 'es-10', serviceId: 'srv-4', serviceName: 'Couple Shoot', quantity: 1 },
        ],
        guestCount: 250,
        price: 65000,
      },
      {
        id: 'evt-4',
        name: 'Walima',
        dayNumber: 4,
        services: [
          { id: 'es-11', serviceId: 'srv-1', serviceName: 'Photographer', quantity: 2 },
          { id: 'es-12', serviceId: 'srv-2', serviceName: 'Videographer', quantity: 1 },
          { id: 'es-13', serviceId: 'srv-3', serviceName: 'Drone', quantity: 1 },
        ],
        guestCount: 200,
        price: 45000,
      },
    ],
    inclusions: DEFAULT_INCLUSIONS,
    payment: {
      grandTotal: 190000, // 35000 + 45000 + 65000 + 45000
      advanceReceived: 50000,
      advanceType: 'fixed',
      balancePayable: 140000,
    },
    termsAndConditions: DEFAULT_SETTINGS.quotation.defaultTerms,
  },
];

export const storage = {
  // Quotations CRUD
  getQuotations: (): Quotation[] => {
    if (typeof window === 'undefined') return SEED_QUOTATIONS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUOTATIONS);
      let list: Quotation[] = SEED_QUOTATIONS;
      if (data) {
        list = JSON.parse(data);
      } else {
        localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(SEED_QUOTATIONS));
      }

      // Auto-migration: Ensure every quotation has a userId and clean inclusion names
      const sanitizedList = list.map((q) => ({
        ...q,
        userId: q.userId || 'user-super-admin',
        inclusions: (q.inclusions || []).map((inc) => {
          const match = inc.name.match(/^(\d+)\s+(.*)$/);
          if (match) {
            return {
              ...inc,
              quantity: inc.quantity || parseInt(match[1]),
              name: match[2],
            };
          }
          return inc;
        }),
      }));

      return sanitizedList;
    } catch (e) {
      console.error('Error reading quotations from localStorage', e);
      return SEED_QUOTATIONS;
    }
  },

  getQuotationById: (id: string): Quotation | null => {
    if (!id) return null;
    const list = storage.getQuotations();
    const cleanId = id.trim().toLowerCase();
    return list.find((q) => q.id.toLowerCase() === cleanId || q.quotationNumber.toLowerCase() === cleanId) || null;
  },

  saveQuotationLocally: (quotation: Quotation): Quotation => {
    const list = storage.getQuotations();
    const existingIndex = list.findIndex((q) => q.id === quotation.id);
    let updatedList: Quotation[];
    const now = new Date().toISOString();

    const updatedQuotation = {
      ...quotation,
      updatedAt: quotation.updatedAt || now,
    };

    if (existingIndex >= 0) {
      updatedList = [...list];
      updatedList[existingIndex] = updatedQuotation;
    } else {
      updatedList = [updatedQuotation, ...list];
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(updatedList));
      storage.triggerAutoBackup();
    }
    return updatedQuotation;
  },

  saveQuotation: (quotation: Quotation): Quotation => {
    const list = storage.getQuotations();
    const existingIndex = list.findIndex((q) => q.id === quotation.id);
    let updatedList: Quotation[];
    const now = new Date().toISOString();

    const updatedQuotation = {
      ...quotation,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      updatedList = [...list];
      updatedList[existingIndex] = updatedQuotation;
    } else {
      updatedQuotation.createdAt = now;
      updatedList = [updatedQuotation, ...list];
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(updatedList));
      window.dispatchEvent(new Event('snap_quotation_updated'));
      storage.triggerAutoBackup();

      // Background API sync so all clients on any IP/device can load the quotation
      try {
        fetch('/api/quotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedQuotation),
        }).catch(() => {});
      } catch {
        // Silent catch for offline or non-blocking network
      }
    }
    return updatedQuotation;
  },

  deleteQuotation: (id: string): void => {
    const list = storage.getQuotations();
    const updatedList = list.filter((q) => q.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(updatedList));
      window.dispatchEvent(new Event('snap_quotation_updated'));
      storage.triggerAutoBackup();
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
        localStorage.setItem(STORAGE_KEYS.QUOTATIONS, JSON.stringify(backupObj.quotations));
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
};
