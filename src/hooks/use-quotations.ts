'use client';

import { useState, useEffect, useCallback } from 'react';
import { Quotation } from '@/lib/types';
import { storage } from '@/lib/storage';
import { generateSecureId } from '@/lib/crypto';

export function useQuotations() {
  const getFilteredQuotations = (): Quotation[] => {
    const user = storage.getCurrentUser();
    const allQuotations = storage.getQuotations();
    if (!user) return [];
    return allQuotations.filter((q) => q.userId === user.id);
  };

  const [quotations, setQuotations] = useState<Quotation[]>(getFilteredQuotations);
  const [loading, setLoading] = useState(false);

  const refreshQuotations = useCallback(() => {
    const user = storage.getCurrentUser();
    const allQuotations = storage.getQuotations();
    if (!user) {
      setQuotations([]);
    } else {
      setQuotations(allQuotations.filter((q) => q.userId === user.id));
    }
  }, []);

  useEffect(() => {
    const handleUpdate = () => refreshQuotations();

    const interval = setInterval(() => {
      refreshQuotations();
    }, 2500);

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

  const saveQuotation = (quotation: Quotation) => {
    const user = storage.getCurrentUser();
    const quotationWithUser: Quotation = {
      ...quotation,
      userId: quotation.userId || user?.id || 'user-super-admin',
    };
    const saved = storage.saveQuotation(quotationWithUser);
    refreshQuotations();
    return saved;
  };

  const deleteQuotation = (id: string) => {
    storage.deleteQuotation(id);
    refreshQuotations();
  };

  const duplicateQuotation = (id: string) => {
    const user = storage.getCurrentUser();
    const target = storage.getQuotationById(id);
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

    const saved = storage.saveQuotation(newQuotation);
    refreshQuotations();
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
