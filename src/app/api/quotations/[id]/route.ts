import { NextResponse } from 'next/server';
import { Quotation } from '@/lib/types';
import { getQuotationFromDb, saveQuotationToDb, deleteQuotationFromDb } from '@/lib/server-db';
import { isQuotationExpired } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing quotation ID' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const quotation = await getQuotationFromDb(id);
    if (quotation) {
      const url = new URL(request.url);
      const isPublic = url.searchParams.get('public') === 'true';
      if (isPublic && (quotation.status === 'trash' || quotation.isDeleted || isQuotationExpired(quotation))) {
        return NextResponse.json({ error: 'Quotation not found' }, { status: 404, headers: NO_CACHE_HEADERS });
      }
      return NextResponse.json({ success: true, quotation }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ error: 'Quotation not found' }, { status: 404, headers: NO_CACHE_HEADERS });
  } catch {
    return NextResponse.json({ error: 'Database lookup failed' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const quotation = (await request.json()) as Quotation;
    if (!quotation) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const toSave: Quotation = {
      ...quotation,
      id: quotation.id || id,
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveQuotationToDb(toSave);
    return NextResponse.json({ success: true, quotation: saved }, { headers: NO_CACHE_HEADERS });
  } catch {
    return NextResponse.json({ error: 'Failed to update quotation in database' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return POST(request, { params });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const existing = await getQuotationFromDb(id);
    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404, headers: NO_CACHE_HEADERS });
    }

    const merged: Quotation = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveQuotationToDb(merged);
    return NextResponse.json({ success: true, quotation: saved }, { headers: NO_CACHE_HEADERS });
  } catch {
    return NextResponse.json({ error: 'Failed to patch quotation in database' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing quotation ID' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    await deleteQuotationFromDb(id);
    return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
  } catch {
    return NextResponse.json({ error: 'Failed to delete quotation from database' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
