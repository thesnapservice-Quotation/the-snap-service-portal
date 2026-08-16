import { Quotation } from './types';

/**
 * REST API Client for Database Operations
 */

export async function apiFetchQuotations(userId?: string): Promise<Quotation[]> {
  try {
    const url = userId ? `/api/quotations?userId=${encodeURIComponent(userId)}` : '/api/quotations';
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.quotations)) {
        return data.quotations;
      }
    }
  } catch (e) {
    console.error('API Fetch Quotations Error:', e);
  }
  return [];
}

export async function apiFetchQuotationById(id: string): Promise<Quotation | null> {
  if (!id) return null;
  try {
    const res = await fetch(`/api/quotations/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.quotation) {
        return data.quotation;
      }
    }
  } catch (e) {
    console.error('API Fetch Quotation By ID Error:', e);
  }
  return null;
}

export async function apiSaveQuotation(quotation: Quotation): Promise<Quotation> {
  try {
    const res = await fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotation),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.quotation) {
        return data.quotation;
      }
    }
  } catch (e) {
    console.error('API Save Quotation Error:', e);
  }
  return quotation;
}

export async function apiDeleteQuotation(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/quotations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (e) {
    console.error('API Delete Quotation Error:', e);
    return false;
  }
}
