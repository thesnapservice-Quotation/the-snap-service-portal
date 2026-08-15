import { NextResponse } from 'next/server';

// Server-side in-memory cache for quotations
const globalQuotationsStore: Map<string, any> = (globalThis as any).__snap_quotations_store || new Map();
(globalThis as any).__snap_quotations_store = globalQuotationsStore;

export async function GET() {
  const quotations = Array.from(globalQuotationsStore.values());
  return NextResponse.json({ quotations });
}

export async function POST(request: Request) {
  try {
    const quotation = await request.json();
    if (!quotation || (!quotation.id && !quotation.quotationNumber)) {
      return NextResponse.json({ error: 'Invalid quotation payload' }, { status: 400 });
    }

    const idKey = (quotation.id || '').toLowerCase();
    const numKey = (quotation.quotationNumber || '').toLowerCase();

    if (idKey) globalQuotationsStore.set(idKey, quotation);
    if (numKey) globalQuotationsStore.set(numKey, quotation);

    return NextResponse.json({ success: true, quotation });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save quotation' }, { status: 500 });
  }
}
