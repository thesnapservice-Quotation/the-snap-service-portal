import { NextResponse } from 'next/server';
import { Quotation } from '@/lib/types';

const KV_BUCKET = 'https://kvdb.io/snap_service_prod_v2';
const globalQuotationsStore: Map<string, Quotation> = (globalThis as unknown as { __snap_quotations_store?: Map<string, Quotation> }).__snap_quotations_store || new Map();
(globalThis as unknown as { __snap_quotations_store?: Map<string, Quotation> }).__snap_quotations_store = globalQuotationsStore;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing quotation ID' }, { status: 400 });
  }

  const cleanId = id.trim().toLowerCase();

  // Tier 1: In-memory cache lookup
  let quotation = globalQuotationsStore.get(cleanId);

  if (!quotation) {
    for (const q of globalQuotationsStore.values()) {
      if (
        (q.id && q.id.toLowerCase() === cleanId) ||
        (q.quotationNumber && q.quotationNumber.toLowerCase() === cleanId)
      ) {
        quotation = q;
        break;
      }
    }
  }

  // Tier 2: Cloud KV persistent storage lookup
  if (!quotation) {
    try {
      const kvRes = await fetch(`${KV_BUCKET}/${encodeURIComponent(cleanId)}`);
      if (kvRes.ok) {
        const textData = await kvRes.text();
        if (textData) {
          quotation = JSON.parse(textData) as Quotation;
          if (quotation) {
            globalQuotationsStore.set(cleanId, quotation);
            if (quotation.id) globalQuotationsStore.set(quotation.id.toLowerCase(), quotation);
            if (quotation.quotationNumber) globalQuotationsStore.set(quotation.quotationNumber.toLowerCase(), quotation);
          }
        }
      }
    } catch {
      // Fail silently and return 404
    }
  }

  if (quotation) {
    return NextResponse.json({ success: true, quotation });
  }

  return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quotation = (await request.json()) as Quotation;
    if (!quotation) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const cleanId = (id || quotation.id || '').toLowerCase();
    const numKey = (quotation.quotationNumber || '').toLowerCase();

    if (cleanId) globalQuotationsStore.set(cleanId, quotation);
    if (numKey) globalQuotationsStore.set(numKey, quotation);

    try {
      const payloadStr = JSON.stringify(quotation);
      if (cleanId) {
        fetch(`${KV_BUCKET}/${encodeURIComponent(cleanId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadStr,
        }).catch(() => {});
      }
      if (numKey && numKey !== cleanId) {
        fetch(`${KV_BUCKET}/${encodeURIComponent(numKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadStr,
        }).catch(() => {});
      }
    } catch {
      // Non-blocking network sync
    }

    return NextResponse.json({ success: true, quotation });
  } catch {
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
  }
}
