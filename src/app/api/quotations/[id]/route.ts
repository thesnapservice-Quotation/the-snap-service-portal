import { NextResponse } from 'next/server';
import { cloudKV } from '@/lib/cloud-kv';

const globalQuotationsStore: Map<string, any> = (globalThis as any).__snap_quotations_store || new Map();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing quotation ID' }, { status: 400 });
  }

  const cleanId = id.trim().toLowerCase();
  
  // 1. Check in-memory store
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

  // 2. Fallback to Cloud KV store for clean short links on any device/IP
  if (!quotation) {
    quotation = await cloudKV.getQuotation(cleanId);
    if (quotation) {
      globalQuotationsStore.set(cleanId, quotation);
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
    const quotation = await request.json();
    if (!quotation) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const cleanId = (id || quotation.id || '').toLowerCase();
    const numKey = (quotation.quotationNumber || '').toLowerCase();

    if (cleanId) globalQuotationsStore.set(cleanId, quotation);
    if (numKey) globalQuotationsStore.set(numKey, quotation);

    cloudKV.saveQuotation(quotation).catch(() => {});

    return NextResponse.json({ success: true, quotation });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
  }
}
