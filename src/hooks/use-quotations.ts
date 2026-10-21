'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Quotation, QuotationStatus } from '@/lib/types';
import { storage } from '@/lib/storage';
import { generateSecureId } from '@/lib/crypto';
import { apiFetchQuotations, apiSaveQuotation, apiDeleteQuotation } from '@/lib/api-client';
import { syncQuotationToGoogleDrive } from '@/lib/google-drive-sync';
import { uploadQuotationDirectToDrive } from '@/lib/google-drive-oauth';
import { sortQuotationsByNumber, isQuotationExpired } from '@/lib/utils';

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
  const isInitialMount = useRef(true);
  const [loading, setLoading] = useState(true);
  const [allQuotations, setAllQuotations] = useState<Quotation[]>(() => {
    if (typeof window === 'undefined') return [];
    const local = storage.getQuotations();
    const user = storage.getCurrentUser();
    if (!user || !user.id) return [];
    const targetWs = resolveUserWs(user);
    const filtered = local.filter((q) => matchesWorkspace(q, targetWs));
    return sortQuotationsByNumber(filtered);
  });

  const quotations = useMemo(() => {
    const list = allQuotations.filter((q) => q.status !== 'trash' && !q.isDeleted && !isQuotationExpired(q));
    return sortQuotationsByNumber(list);
  }, [allQuotations]);

  const trashQuotations = useMemo(() => {
    const list = allQuotations.filter((q) => q.status === 'trash' || q.isDeleted || isQuotationExpired(q));
    return sortQuotationsByNumber(list);
  }, [allQuotations]);

  const refreshQuotations = useCallback(async (isSilent = false) => {
    const user = storage.getCurrentUser();
    if (!user || !user.id) {
      setAllQuotations([]);
      setLoading(false);
      isInitialMount.current = false;
      return;
    }

    const targetWs = resolveUserWs(user);

    if (!isSilent && isInitialMount.current) {
      setLoading(true);
    }

    try {
      // 1. Direct query to Central Production Database scoped strictly by workspaceId
      const dbQuotations = await apiFetchQuotations(targetWs);
      const deletedIds = storage.getDeletedIds();

      if (Array.isArray(dbQuotations)) {
        // Filter out any permanently deleted items from DB results
        const validDbQuotations = dbQuotations.filter((q) => {
          const idMatch = q.id && deletedIds.has(q.id.toLowerCase());
          const numMatch = q.quotationNumber && deletedIds.has(q.quotationNumber.toLowerCase());
          const wsMatch = matchesWorkspace(q, targetWs);
          return !idMatch && !numMatch && wsMatch;
        });

        // Process expired unconfirmed quotations
        const processedDb = validDbQuotations.map((q) => {
          if (isQuotationExpired(q)) {
            return {
              ...q,
              previousStatus: q.status !== 'trash' ? q.status : (q.previousStatus || 'sent'),
              status: 'trash' as QuotationStatus,
              isDeleted: true,
              autoExpired: true,
              autoExpiredReason: 'Event date arrived/passed without client confirmation',
              deletedAt: q.deletedAt || new Date().toISOString(),
            };
          }
          return q;
        });

        // Set DB as authoritative
        const sorted = sortQuotationsByNumber(processedDb);
        storage.setAllQuotations(sorted);
        setAllQuotations(sorted);
      } else {
        const local = storage.getQuotations();
        const filtered = local.filter((q) => matchesWorkspace(q, targetWs));
        if (filtered.length > 0) {
          const processedLocal = filtered.map((q) => {
            if (isQuotationExpired(q)) {
              return {
                ...q,
                previousStatus: q.status !== 'trash' ? q.status : (q.previousStatus || 'sent'),
                status: 'trash' as QuotationStatus,
                isDeleted: true,
                autoExpired: true,
                autoExpiredReason: 'Event date arrived/passed without client confirmation',
                deletedAt: q.deletedAt || new Date().toISOString(),
              };
            }
            return q;
          });
          setAllQuotations(sortQuotationsByNumber(processedLocal));
        }
      }
    } catch {
      // Keep existing state or local fallback on network error
      const local = storage.getQuotations();
      const filtered = local.filter((q) => matchesWorkspace(q, targetWs));
      if (filtered.length > 0) {
        setAllQuotations(sortQuotationsByNumber(filtered));
      }
    } finally {
      isInitialMount.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshQuotations(false);

    const handleUpdate = () => refreshQuotations(true);

    // Safe visibility-aware sync: Only refresh when tab is visible
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshQuotations(true);
      }
    }, 30000);

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
    setAllQuotations((prev) => {
      const idx = prev.findIndex((q) => q.id === savedFromDb.id);
      let next: Quotation[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = savedFromDb;
      } else {
        next = [savedFromDb, ...prev];
      }
      return sortQuotationsByNumber(next);
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

  const moveToTrash = async (id: string, reason?: string): Promise<Quotation | null> => {
    const target = allQuotations.find((q) => q.id === id || q.quotationNumber === id) || storage.getQuotationById(id);
    if (!target) return null;

    const previous = target.status !== 'trash' ? target.status : (target.previousStatus || 'sent');

    const updatedQuotation: Quotation = {
      ...target,
      previousStatus: previous,
      status: 'trash',
      isDeleted: true,
      autoExpired: Boolean(reason),
      autoExpiredReason: reason,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await saveQuotation(updatedQuotation);
  };

  const restoreFromTrash = async (id: string): Promise<Quotation | null> => {
    const target = allQuotations.find((q) => q.id === id || q.quotationNumber === id) || storage.getQuotationById(id);
    if (!target) return null;

    const hasAdvance = (target.payment?.transactions?.length || 0) > 0 || (Number(target.payment?.advanceReceived) || 0) > 0;
    const hasAcceptedVar = Boolean(target.variations && target.variations.some(v => v.isAccepted));
    let targetStatus = (target.previousStatus as QuotationStatus) || 'sent';
    if (hasAdvance || hasAcceptedVar) {
      targetStatus = 'confirmed';
    } else if (targetStatus === 'trash') {
      targetStatus = 'sent';
    }

    const updatedQuotation: Quotation = {
      ...target,
      status: targetStatus,
      isDeleted: false,
      deletedAt: undefined,
      autoExpired: false,
      autoExpiredReason: undefined,
      restoredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await saveQuotation(updatedQuotation);
  };

  const permanentlyDeleteQuotation = async (id: string): Promise<void> => {
    const target =
      allQuotations.find(
        (q) => q.id === id || q.quotationNumber === id || q.id.toLowerCase() === id.toLowerCase()
      ) || storage.getQuotationById(id);
    const targetId = target?.id || id;
    const targetNum = target?.quotationNumber;

    // 1. Immediately delete from local storage and update React state
    storage.deleteQuotation(targetId);
    if (targetNum) storage.deleteQuotation(targetNum);

    setAllQuotations((prev) =>
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

  const emptyTrash = async (): Promise<void> => {
    const trashItems = allQuotations.filter((q) => q.status === 'trash' || q.isDeleted);
    for (const item of trashItems) {
      await permanentlyDeleteQuotation(item.id);
    }
  };

  const bulkMoveToTrash = async (ids: string[]): Promise<void> => {
    for (const id of ids) {
      await moveToTrash(id);
    }
  };

  const bulkRestoreFromTrash = async (ids: string[]): Promise<void> => {
    for (const id of ids) {
      await restoreFromTrash(id);
    }
  };

  const bulkPermanentlyDelete = async (ids: string[]): Promise<void> => {
    for (const id of ids) {
      await permanentlyDeleteQuotation(id);
    }
  };

  // Safe delete (moves to trash by default)
  const deleteQuotation = async (id: string): Promise<void> => {
    await moveToTrash(id);
  };

  const duplicateQuotation = async (id: string): Promise<Quotation | null> => {
    const user = storage.getCurrentUser();
    const target = allQuotations.find((q) => q.id === id) || storage.getQuotationById(id);
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
      isDeleted: false,
      deletedAt: undefined,
      payment: {
        ...target.payment,
        advanceReceived: 0,
        transactions: [],
        clientProposedAdvance: undefined,
        balancePayable: target.payment?.grandTotal || 0,
        paymentStatus: 'unpaid',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveQuotation(newQuotation);
    return saved;
  };

  return {
    quotations,
    trashQuotations,
    allQuotations,
    loading,
    refreshQuotations,
    saveQuotation,
    deleteQuotation,
    moveToTrash,
    restoreFromTrash,
    permanentlyDeleteQuotation,
    emptyTrash,
    bulkMoveToTrash,
    bulkRestoreFromTrash,
    bulkPermanentlyDelete,
    duplicateQuotation,
  };
}
