'use client';

import { useState, useEffect, useCallback } from 'react';
import { Quotation } from '@/lib/types';
import { storage } from '@/lib/storage';
import { generateSecureId } from '@/lib/crypto';
import { apiFetchQuotations, apiSaveQuotation, apiDeleteQuotation } from '@/lib/api-client';

export function useQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshQuotations = useCallback(async () => {
    const user = storage.getCurrentUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Direct query to Central Production Database
      const dbQuotations = await apiFetchQuotations(user.id);
      if (Array.isArray(dbQuotations)) {
        setQuotations(dbQuotations);
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
      userId: quotation.userId || user?.id || 'user-super-admin',
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
