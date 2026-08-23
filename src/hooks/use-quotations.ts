'use client';

import { useState, useEffect, useCallback } from 'react';
import { Quotation } from '@/lib/types';
import { storage } from '@/lib/storage';
import { generateSecureId } from '@/lib/crypto';
import { apiFetchQuotations, apiSaveQuotation, apiDeleteQuotation } from '@/lib/api-client';
import { syncQuotationToGoogleDrive } from '@/lib/google-drive-sync';
import { uploadQuotationDirectToDrive } from '@/lib/google-drive-oauth';

function resolveUserWs(u: any): string {
  if (!u || !u.id) return 'ws_user-super-admin';
  if (u.role === 'super_admin' || u.id === 'user-super-admin') return 'ws_user-super-admin';
  return u.workspaceId || `ws_${u.id}`;
}

function matchesWorkspace(q: Quotation, targetWs: string): boolean {
  if (q.workspaceId) return q.workspaceId === targetWs;
  if (q.userId) {
    const creatorWs = q.userId === 'user-super-admin' ? 'ws_user-super-admin' : `ws_${q.userId}`;
    return creatorWs === targetWs;
  }
  return targetWs === 'ws_user-super-admin';
}

export function useQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    if (typeof window === 'undefined') return [];
    const local = storage.getQuotations();
    const user = storage.getCurrentUser();
    if (!user || !user.id) return [];
    const targetWs = resolveUserWs(user);
    return local.filter((q) => matchesWorkspace(q, targetWs));
  });
  const [loading, setLoading] = useState(false);

  const refreshQuotations = useCallback(async () => {
    const user = storage.getCurrentUser();
    if (!user || !user.id) {
      setQuotations([]);
      return;
    }

    const targetWs = resolveUserWs(user);

    try {
      // 1. Direct query to Central Production Database scoped strictly by workspaceId
      const dbQuotations = await apiFetchQuotations(targetWs);
      const deletedIds = storage.getDeletedIds();

      if (Array.isArray(dbQuotations)) {
        // Filter out any deleted items from DB results
        const validDbQuotations = dbQuotations.filter((q) => {
          const idMatch = q.id && deletedIds.has(q.id.toLowerCase());
          const numMatch = q.quotationNumber && deletedIds.has(q.quotationNumber.toLowerCase());
          const wsMatch = matchesWorkspace(q, targetWs);
          return !idMatch && !numMatch && wsMatch;
        });

        // Set DB as authoritative
        storage.setAllQuotations(validDbQuotations);
        setQuotations(validDbQuotations);
      } else {
        const local = storage.getQuotations();
        const filtered = local.filter((q) => matchesWorkspace(q, targetWs));
        if (filtered.length > 0) {
          setQuotations(filtered);
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
    const targetWs = user?.role === 'super_admin' || user?.id === 'user-super-admin'
      ? 'ws_user-super-admin'
      : (user?.workspaceId || `ws_${user?.id || 'user-super-admin'}`);
    const authorId = user?.id || quotation.userId || 'user-super-admin';
    
    // Explicitly preserve submitted status without overriding to confirmed
    const finalStatus = quotation.status || 'sent';

    const quotationWithWs: Quotation = {
      ...quotation,
      workspaceId: quotation.workspaceId || targetWs,
      userId: authorId,
      createdByUserId: quotation.createdByUserId || authorId,
      updatedByUserId: authorId,
      status: finalStatus,
      updatedAt: new Date().toISOString(),
    };

    // 1. Persist directly to Central Production Database
    const savedFromDb = await apiSaveQuotation(quotationWithWs);

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
    const target =
      quotations.find(
        (q) => q.id === id || q.quotationNumber === id || q.id.toLowerCase() === id.toLowerCase()
      ) || storage.getQuotationById(id);
    const targetId = target?.id || id;
    const targetNum = target?.quotationNumber;

    // 1. Immediately delete from local storage and update React state
    storage.deleteQuotation(targetId);
    if (targetNum) storage.deleteQuotation(targetNum);

    setQuotations((prev) =>
      prev.filter(
        (q) =>
          q.id !== targetId &&
          q.id !== id &&
          (!targetNum || q.quotationNumber !== targetNum)
      )
    );

    // 2. Delete from Central Production Database / Supabase
    try {
      await apiDeleteQuotation(targetId);
      if (targetNum && targetNum !== targetId) {
        await apiDeleteQuotation(targetNum);
      }
    } catch {}

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
