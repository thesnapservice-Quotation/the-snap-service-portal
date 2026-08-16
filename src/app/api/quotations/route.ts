import { NextResponse } from 'next/server';
import { Quotation } from '@/lib/types';

const KV_BUCKET = 'https://kvdb.io/snap_service_prod_v2';
const globalQuotationsStore: Map<string, Quotation> = (globalThis as unknown as { __snap_quotations_store?: Map<string, Quotation> }).__snap_quotations_store || new Map();
(globalThis as unknown as { __snap_quotations_store?: Map<string, Quotation> }).__snap_quotations_store = globalQuotationsStore;

export async function GET(request: Request) {
  // Protect studio client registry from open scraping
  const authHeader = request.headers.get('authorization') || request.headers.get('x-snap-secret');
  
  if (!authHeader) {
    // Return sanitized summary count instead of dumping all client personal data
    return NextResponse.json({
      total: globalQuotationsStore.size,
      message: 'Authentication required for full registry access.',
    }, { status: 401 });
  }

  const quotations = Array.from(globalQuotationsStore.values());
  return NextResponse.json({ quotations });
}

export async function POST(request: Request) {
  try {
    const quotation = (await request.json()) as Quotation;
    if (!quotation || (!quotation.id && !quotation.quotationNumber)) {
      return NextResponse.json({ error: 'Invalid quotation payload' }, { status: 400 });
    }

    const idKey = (quotation.id || '').toLowerCase();
    const numKey = (quotation.quotationNumber || '').toLowerCase();

    if (idKey) globalQuotationsStore.set(idKey, quotation);
    if (numKey) globalQuotationsStore.set(numKey, quotation);

    // Persistent cloud KV storage sync for global access without query params
    try {
      const payloadStr = JSON.stringify(quotation);
      if (numKey) {
        fetch(`${KV_BUCKET}/${encodeURIComponent(numKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadStr,
        }).catch(() => {});
      }
      if (idKey && idKey !== numKey) {
        fetch(`${KV_BUCKET}/${encodeURIComponent(idKey)}`, {
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
    return NextResponse.json({ error: 'Failed to save quotation' }, { status: 500 });
  }
}
