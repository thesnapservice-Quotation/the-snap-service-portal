import { NextResponse } from 'next/server';

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
  const quotation = globalQuotationsStore.get(cleanId);

  if (quotation) {
    return NextResponse.json({ success: true, quotation });
  }

  // Search by exact ID or Quotation Number
  for (const q of globalQuotationsStore.values()) {
    if (
      (q.id && q.id.toLowerCase() === cleanId) ||
      (q.quotationNumber && q.quotationNumber.toLowerCase() === cleanId)
    ) {
      return NextResponse.json({ success: true, quotation: q });
    }
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

    return NextResponse.json({ success: true, quotation });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update quotation' }, { status: 500 });
  }
}
