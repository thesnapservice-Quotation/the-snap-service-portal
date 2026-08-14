import { useState, useEffect } from 'react';
import { Quotation } from '@/lib/types';
import { storage } from '@/lib/storage';

export function useQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshQuotations = () => {
    const user = storage.getCurrentUser();
    const allQuotations = storage.getQuotations();

    if (!user) {
      setQuotations([]);
    } else {
      // Every account (Super Admin and Standard Users) sees ONLY their own created quotations
      setQuotations(allQuotations.filter((q) => q.userId === user.id));
    }
  };

  useEffect(() => {
    refreshQuotations();
    setLoading(false);

    const handleUpdate = () => refreshQuotations();

    // Auto Polling Every 2.5 Seconds: Syncs client portal acceptances instantly to admin panel!
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
  }, []);

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

    const list = storage.getQuotations();
    const settings = storage.getSettings();
    const nextNum = settings.quotation.startingNumber + list.length + 1;

    const newQuotation: Quotation = {
      ...target,
      id: `quote-${Date.now()}`,
      quotationNumber: `${settings.quotation.prefix}-${nextNum}`,
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
