'use client';

import { useState, useEffect, useCallback } from 'react';
import { Quotation } from '@/lib/types';
import { storage } from '@/lib/storage';
import { generateSecureId } from '@/lib/crypto';
import { apiFetchQuotations, apiSaveQuotation, apiDeleteQuotation } from '@/lib/api-client';
import { syncQuotationToGoogleDrive } from '@/lib/google-drive-sync';
import { uploadQuotationDirectToDrive } from '@/lib/google-drive-oauth';

export function useQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    if (typeof window === 'undefined') return [];
    const local = storage.getQuotations();
    const user = storage.getCurrentUser();
    if (!user) return local;
    if (user.role === 'super_admin' || user.id === 'user-super-admin') {
      return local;
    }
    return local.filter((q) => q.userId === user.id);
  });
  const [loading, setLoading] = useState(false);

  const refreshQuotations = useCallback(async () => {
    const user = storage.getCurrentUser();
    if (!user || !user.id) {
      return;
    }

    try {
      // 1. Direct query to Central Production Database
      const dbQuotations = await apiFetchQuotations(user.id);
      const local = storage.getQuotations();

      if (Array.isArray(dbQuotations) && dbQuotations.length > 0) {
        // Merge DB with local storage seamlessly
        const map = new Map<string, Quotation>();
        for (const q of local) {
          if (q.id) map.set(q.id, q);
        }
        for (const q of dbQuotations) {
          if (q.id) map.set(q.id, q);
        }
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        );
        storage.setAllQuotations(merged);

        if (user.role === 'super_admin' || user.id === 'user-super-admin') {
          setQuotations(merged);
        } else {
          setQuotations(merged.filter((q) => q.userId === user.id));
        }
      } else if (local.length > 0) {
        // If DB is initializing or temporarily empty, DO NOT wipe existing quotations!
        if (user.role === 'super_admin' || user.id === 'user-super-admin') {
          setQuotations(local);
        } else {
          setQuotations(local.filter((q) => q.userId === user.id));
        }
      }
    } catch {
      // Keep existing state on network error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshQuotations();

    const handleUpdate = () => refreshQuotations();

    // Auto-poll database every 5 seconds for real-time cross-device sync between MacBook and Phone
    const interval = setInterval(() => {
      refreshQuotations();
    }, 5000);

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleUpdate);
      window.addEventListener('snap_quotation_updated', handleUpdate);
      window.addEventListener('focus', handleUpdate);
    }

    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleUpdate);
        window.removeEventListener('snap_quotation_updated', handleUpdate);
        window.removeEventListener('focus', handleUpdate);
      }
    };
  }, [refreshQuotations]);

  const saveQuotation = async (quotation: Quotation): Promise<Quotation> => {
    const user = storage.getCurrentUser();
    
    // Explicitly preserve submitted status without overriding to confirmed
    const finalStatus = quotation.status || 'sent';

    const quotationWithUser: Quotation = {
      ...quotation,
      status: finalStatus,
      userId: user?.id || quotation.userId || 'user-super-admin',
      updatedAt: new Date().toISOString(),
    };

    // 1. Persist directly to Central Production Database
    const savedFromDb = await apiSaveQuotation(quotationWithUser);

    // 2. Update local state
    setQuotations((prev) => {
      const idx = prev.findIndex((q) => q.id === savedFromDb.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedFromDb;
        return next;
      }
      return [savedFromDb, ...prev];
    });

    storage.saveQuotationLocally(savedFromDb);

    // 3. Auto-mirror to Google Drive if configured
    const settings = storage.getSettings();
    if (settings.integrations?.googleDriveWebhookUrl && settings.integrations?.autoSyncGoogleDrive !== false) {
      syncQuotationToGoogleDrive(savedFromDb, settings.integrations.googleDriveWebhookUrl).catch(() => {});
    }
    uploadQuotationDirectToDrive(savedFromDb).catch(() => {});

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('snap_quotation_updated'));
    }

    return savedFromDb;
  };

  const deleteQuotation = async (id: string): Promise<void> => {
    // 1. Delete from Central Production Database
    await apiDeleteQuotation(id);

    // 2. Update local state
    setQuotations((prev) => prev.filter((q) => q.id !== id));
    storage.deleteQuotation(id);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('snap_quotation_updated'));
    }
  };

  const duplicateQuotation = async (id: string): Promise<Quotation | null> => {
    const user = storage.getCurrentUser();
    const target = quotations.find((q) => q.id === id) || storage.getQuotationById(id);
    if (!target) return null;

    const settings = storage.getSettings();
    const nextNum = storage.generateQuotationNumber();

    const newQuotation: Quotation = {
      ...target,
      id: generateSecureId('quote'),
      quotationNumber: nextNum || `${settings.quotation.prefix}-100`,
      userId: user?.id || target.userId || 'user-super-admin',
      client: {
        ...target.client,
        name: `${target.client.name} (Copy)`,
      },
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveQuotation(newQuotation);
    return saved;
  };

  return {
    quotations,
    loading,
    refreshQuotations,
    saveQuotation,
    deleteQuotation,
    duplicateQuotation,
  };
}
