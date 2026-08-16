import { NextResponse } from 'next/server';
import { Quotation } from '@/lib/types';
import { getQuotationsFromDb, saveQuotationToDb } from '@/lib/server-db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || request.headers.get('x-user-id') || undefined;

    const quotations = await getQuotationsFromDb(userId);
    return NextResponse.json({ success: true, quotations });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch quotations from database' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const quotation = (await request.json()) as Quotation;
    if (!quotation || (!quotation.id && !quotation.quotationNumber)) {
      return NextResponse.json({ error: 'Invalid quotation payload' }, { status: 400 });
    }

    const saved = await saveQuotationToDb(quotation);
    return NextResponse.json({ success: true, quotation: saved });
  } catch {
    return NextResponse.json({ error: 'Failed to save quotation to database' }, { status: 500 });
  }
}
