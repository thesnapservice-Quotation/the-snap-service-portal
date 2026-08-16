import { Quotation } from './types';

const KV_BUCKET = 'https://kvdb.io/snap_service_prod_v3';

// In-memory runtime cache
const memoryStore: Map<string, Quotation> =
  (globalThis as unknown as { __snap_quotations_store?: Map<string, Quotation> }).__snap_quotations_store ||
  new Map();
(globalThis as unknown as { __snap_quotations_store?: Map<string, Quotation> }).__snap_quotations_store = memoryStore;

// In-memory index of quotation IDs
const memoryIndex: Set<string> =
  (globalThis as unknown as { __snap_quotations_index?: Set<string> }).__snap_quotations_index ||
  new Set();
(globalThis as unknown as { __snap_quotations_index?: Set<string> }).__snap_quotations_index = memoryIndex;

async function fetchFromKv(key: string): Promise<string | null> {
  try {
    const res = await fetch(`${KV_BUCKET}/${encodeURIComponent(key)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const text = await res.text();
      return text || null;
    }
  } catch {
    // Non-blocking catch
  }
  return null;
}

async function writeToKv(key: string, data: string): Promise<boolean> {
  try {
    const res = await fetch(`${KV_BUCKET}/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data,
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function deleteFromKv(key: string): Promise<boolean> {
  try {
    const res = await fetch(`${KV_BUCKET}/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function saveQuotationToDb(quotation: Quotation): Promise<Quotation> {
  const idKey = (quotation.id || '').toLowerCase();
  const numKey = (quotation.quotationNumber || '').toLowerCase();
  const userId = quotation.userId || 'user-super-admin';

  // 1. Update in-memory store
  if (idKey) memoryStore.set(idKey, quotation);
  if (numKey) memoryStore.set(numKey, quotation);
  if (quotation.id) memoryIndex.add(quotation.id);

  // 2. Persist to Cloud Database
  const payloadStr = JSON.stringify(quotation);
  if (idKey) await writeToKv(`q_${idKey}`, payloadStr);
  if (numKey && numKey !== idKey) await writeToKv(`q_${numKey}`, payloadStr);

  // 3. Update persistent User and Global Indexes
  try {
    // User Index
    const userIndexRaw = await fetchFromKv(`idx_${userId}`);
    let userIds: string[] = [];
    if (userIndexRaw) {
      try {
        userIds = JSON.parse(userIndexRaw);
      } catch {}
    }
    if (!userIds.includes(quotation.id)) {
      userIds.unshift(quotation.id);
      await writeToKv(`idx_${userId}`, JSON.stringify(userIds));
    }

    // Global Index
    const globalIndexRaw = await fetchFromKv(`idx_global`);
    let globalIds: string[] = [];
    if (globalIndexRaw) {
      try {
        globalIds = JSON.parse(globalIndexRaw);
      } catch {}
    }
    if (!globalIds.includes(quotation.id)) {
      globalIds.unshift(quotation.id);
      await writeToKv(`idx_global`, JSON.stringify(globalIds));
    }
  } catch {
    // Non-blocking index update
  }

  return quotation;
}

export async function getQuotationFromDb(idOrNumber: string): Promise<Quotation | null> {
  if (!idOrNumber) return null;
  const cleanKey = idOrNumber.trim().toLowerCase();

  // 1. Check in-memory cache
  const cached = memoryStore.get(cleanKey);
  if (cached) return cached;

  for (const q of memoryStore.values()) {
    if (
      (q.id && q.id.toLowerCase() === cleanKey) ||
      (q.quotationNumber && q.quotationNumber.toLowerCase() === cleanKey)
    ) {
      return q;
    }
  }

  // 2. Fetch from Cloud Database
  const raw = await fetchFromKv(`q_${cleanKey}`);
  if (raw) {
    try {
      const q = JSON.parse(raw) as Quotation;
      if (q && q.id) {
        memoryStore.set(q.id.toLowerCase(), q);
        if (q.quotationNumber) memoryStore.set(q.quotationNumber.toLowerCase(), q);
        memoryIndex.add(q.id);
        return q;
      }
    } catch {}
  }

  return null;
}

export async function getQuotationsFromDb(userId?: string): Promise<Quotation[]> {
  const result: Quotation[] = [];
  const seenIds = new Set<string>();

  // 1. Try to load user or global index from Cloud Database
  let idList: string[] = [];
  try {
    const rawIdx = userId ? await fetchFromKv(`idx_${userId}`) : await fetchFromKv(`idx_global`);
    if (rawIdx) {
      idList = JSON.parse(rawIdx);
    }
  } catch {}

  // Merge with any in-memory IDs
  for (const id of Array.from(memoryIndex)) {
    if (!idList.includes(id)) {
      idList.push(id);
    }
  }

  // 2. Fetch each quotation
  for (const id of idList) {
    if (seenIds.has(id)) continue;
    const q = await getQuotationFromDb(id);
    if (q) {
      if (!userId || q.userId === userId || userId === 'user-super-admin' || !q.userId) {
        result.push(q);
        seenIds.add(q.id);
      }
    }
  }

  // Also include any memory store quotations matching user
  for (const q of Array.from(memoryStore.values())) {
    if (q.id && !seenIds.has(q.id)) {
      if (!userId || q.userId === userId || userId === 'user-super-admin' || !q.userId) {
        result.push(q);
        seenIds.add(q.id);
      }
    }
  }

  return result;
}

export async function deleteQuotationFromDb(id: string, userId?: string): Promise<boolean> {
  const cleanId = id.trim().toLowerCase();
  const target = await getQuotationFromDb(cleanId);
  const numKey = target?.quotationNumber?.toLowerCase();
  const effectiveUserId = target?.userId || userId || 'user-super-admin';

  // 1. Remove from memory
  memoryStore.delete(cleanId);
  if (numKey) memoryStore.delete(numKey);
  memoryIndex.delete(id);

  // 2. Remove from Cloud Database
  await deleteFromKv(`q_${cleanId}`);
  if (numKey && numKey !== cleanId) await deleteFromKv(`q_${numKey}`);

  // 3. Remove from indexes
  try {
    const rawUserIdx = await fetchFromKv(`idx_${effectiveUserId}`);
    if (rawUserIdx) {
      const userIds: string[] = JSON.parse(rawUserIdx);
      const filtered = userIds.filter((item) => item !== id && item.toLowerCase() !== cleanId);
      await writeToKv(`idx_${effectiveUserId}`, JSON.stringify(filtered));
    }

    const rawGlobalIdx = await fetchFromKv(`idx_global`);
    if (rawGlobalIdx) {
      const globalIds: string[] = JSON.parse(rawGlobalIdx);
      const filtered = globalIds.filter((item) => item !== id && item.toLowerCase() !== cleanId);
      await writeToKv(`idx_global`, JSON.stringify(filtered));
    }
  } catch {}

  return true;
}
