'use client';

import { useState, useEffect, useCallback } from 'react';
import { Quotation } from '@/lib/types';
import { storage } from '@/lib/storage';
import { generateSecureId } from '@/lib/crypto';
import { apiFetchQuotations, apiSaveQuotation, apiDeleteQuotation } from '@/lib/api-client';

export function useQuotations() {
  const getFilteredQuotations = (): Quotation[] => {
    const user = storage.getCurrentUser();
    const allQuotations = storage.getQuotations();
    if (!user) return [];
    return allQuotations.filter((q) => q.userId === user.id);
  };

  const [quotations, setQuotations] = useState<Quotation[]>(getFilteredQuotations);
  const [loading, setLoading] = useState(false);

  const refreshQuotations = useCallback(async () => {
    const user = storage.getCurrentUser();
    if (!user) {
      setQuotations([]);
      return;
    }

    // 1. Initial immediate local cache render
    const localAll = storage.getQuotations();
    const userLocal = localAll.filter((q) => q.userId === user.id);
    if (userLocal.length > 0) {
      setQuotations(userLocal);
    }

    // 2. Fetch ground-truth records from persistent Cloud Database
    try {
      const dbQuotations = await apiFetchQuotations(user.id);
      if (dbQuotations && dbQuotations.length > 0) {
        // Sync database records to local cache so offline works seamlessly
        for (const q of dbQuotations) {
          storage.saveQuotationLocally(q);
        }
        setQuotations(dbQuotations);
      }
    } catch {
      // Fallback to local cache if network is temporarily unreachable
    }
  }, []);

  useEffect(() => {
    refreshQuotations();

    const handleUpdate = () => refreshQuotations();

    // Auto-poll database every 3.5 seconds to sync client portal updates across devices
    const interval = setInterval(() => {
      refreshQuotations();
    }, 3500);

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
    const quotationWithUser: Quotation = {
      ...quotation,
      userId: quotation.userId || user?.id || 'user-super-admin',
      updatedAt: new Date().toISOString(),
    };

    // 1. Save to local storage for instant responsiveness
    storage.saveQuotationLocally(quotationWithUser);

    // 2. Persist to central Cloud Database
    const savedFromDb = await apiSaveQuotation(quotationWithUser);

    // 3. Update state
    setQuotations((prev) => {
      const idx = prev.findIndex((q) => q.id === savedFromDb.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedFromDb;
        return next;
      }
      return [savedFromDb, ...prev];
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('snap_quotation_updated'));
    }

    return savedFromDb;
  };

  const deleteQuotation = async (id: string): Promise<void> => {
    // 1. Local delete
    storage.deleteQuotation(id);

    // 2. Database delete
    await apiDeleteQuotation(id);

    // 3. Update state
    setQuotations((prev) => prev.filter((q) => q.id !== id));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('snap_quotation_updated'));
    }
  };

  const duplicateQuotation = async (id: string): Promise<Quotation | null> => {
    const user = storage.getCurrentUser();
    const target = storage.getQuotationById(id) || quotations.find((q) => q.id === id);
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
