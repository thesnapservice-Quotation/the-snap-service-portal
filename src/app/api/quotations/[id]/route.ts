import { NextResponse } from 'next/server';
import { Quotation } from '@/lib/types';
import { getQuotationFromDb, saveQuotationToDb, deleteQuotationFromDb } from '@/lib/server-db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing quotation ID' }, { status: 400 });
    }

    const quotation = await getQuotationFromDb(id);
    if (quotation) {
      return NextResponse.json({ success: true, quotation });
    }

    return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Database lookup failed' }, { status: 500 });
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
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const toSave: Quotation = {
      ...quotation,
      id: quotation.id || id,
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveQuotationToDb(toSave);
    return NextResponse.json({ success: true, quotation: saved });
  } catch {
    return NextResponse.json({ error: 'Failed to update quotation in database' }, { status: 500 });
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
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const merged: Quotation = {
      ...existing,
      ...updates,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveQuotationToDb(merged);
    return NextResponse.json({ success: true, quotation: saved });
  } catch {
    return NextResponse.json({ error: 'Failed to patch quotation in database' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing quotation ID' }, { status: 400 });
    }

    await deleteQuotationFromDb(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete quotation from database' }, { status: 500 });
  }
}
