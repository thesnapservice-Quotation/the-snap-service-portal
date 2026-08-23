import { NextResponse } from 'next/server';
import { getPublicQuotationFromDb } from '@/lib/server-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || '';
    const quotationNumber = url.searchParams.get('quotationNumber') || '';
    const pin = url.searchParams.get('pin') || '';

    if (!date || !quotationNumber || !pin) {
      return NextResponse.json(
        { error: 'Missing required parameters (date, quotationNumber, pin)' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const quotation = await getPublicQuotationFromDb(date, quotationNumber, pin);

    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json({ success: true, quotation }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Lookup failed', message: err.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
