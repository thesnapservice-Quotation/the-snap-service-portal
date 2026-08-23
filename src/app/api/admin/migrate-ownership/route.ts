import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Quotation } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    // 1. Fetch current quotations from Supabase
    const { data: rawRows, error } = await supabase.from('quotations').select('*');
    if (error || !rawRows) {
      return NextResponse.json({ error: 'Failed to fetch quotations from database', details: error }, { status: 500 });
    }

    const businessRows = rawRows.filter(
      (r) =>
        r.id &&
        !r.id.startsWith('sys_') &&
        !r.full_data?.isSystemTaskRecord &&
        !r.full_data?.isSystemSettingsRecord &&
        !r.full_data?.isSystemServicesRecord
    );

    const beforeCount = businessRows.length;
    if (beforeCount !== 6) {
      return NextResponse.json({ error: `Pre-check failed: expected 6 business quotations, found ${beforeCount}` }, { status: 400 });
    }

    const migrationTargets: Record<string, { workspaceId: string; createdByUserId: string; updatedByUserId: string }> = {
      'SS-2026-101': { workspaceId: 'ws_user-super-admin', createdByUserId: 'user-super-admin', updatedByUserId: 'user-super-admin' },
      'SS-2026-102': { workspaceId: 'ws_user-super-admin', createdByUserId: 'user-super-admin', updatedByUserId: 'user-super-admin' },
      'SS-2026-105': { workspaceId: 'ws_user-super-admin', createdByUserId: 'user-super-admin', updatedByUserId: 'user-super-admin' },
      'SS-2026-106': { workspaceId: 'ws_user-super-admin', createdByUserId: 'user-super-admin', updatedByUserId: 'user-super-admin' },
      'SS-2026-107': { workspaceId: 'ws_user-super-admin', createdByUserId: 'user-super-admin', updatedByUserId: 'user-super-admin' },
      'SS-2026-902': { workspaceId: 'ws_user-staff-1', createdByUserId: 'user-staff-1', updatedByUserId: 'user-staff-1' },
    };

    const updateResults: any[] = [];

    for (const r of businessRows) {
      const qNum = (r.quotation_number || r.full_data?.quotationNumber || '').toUpperCase().trim();
      const targetMeta = migrationTargets[qNum];

      if (!targetMeta) {
        return NextResponse.json({ error: `Unrecognized quotation number: ${qNum}` }, { status: 400 });
      }

      const existingFullData = r.full_data || {};

      // Preserve ALL business data byte-for-byte; update ONLY the three ownership fields
      const updatedFullData: Quotation = {
        ...existingFullData,
        workspaceId: targetMeta.workspaceId,
        userId: targetMeta.createdByUserId,
        createdByUserId: targetMeta.createdByUserId,
        updatedByUserId: targetMeta.updatedByUserId,
        // Preserve exact existing updatedAt
        updatedAt: existingFullData.updatedAt || r.updated_at,
      };

      const updatePayload = {
        id: r.id,
        quotation_number: r.quotation_number,
        user_id: targetMeta.createdByUserId,
        full_data: updatedFullData,
        // Preserve other columns exactly
        status: r.status,
        client: r.client,
        events: r.events,
        inclusions: r.inclusions,
        payment: r.payment,
        created_at: r.created_at,
        updated_at: r.updated_at,
      };

      const { error: upsertErr } = await supabase
        .from('quotations')
        .upsert(updatePayload, { onConflict: 'id' });

      if (upsertErr) {
        return NextResponse.json({ error: `Failed to update ${qNum}`, details: upsertErr }, { status: 500 });
      }

      updateResults.push({
        quotationNumber: qNum,
        id: r.id,
        before: {
          workspaceId: existingFullData.workspaceId || null,
          userId: r.user_id,
          createdByUserId: existingFullData.createdByUserId || null,
          updatedByUserId: existingFullData.updatedByUserId || null,
        },
        after: {
          workspaceId: targetMeta.workspaceId,
          userId: targetMeta.createdByUserId,
          createdByUserId: targetMeta.createdByUserId,
          updatedByUserId: targetMeta.updatedByUserId,
        },
        businessDataPreserved: {
          clientName: r.client?.name || existingFullData.client?.name,
          grandTotal: r.payment?.grandTotal || existingFullData.payment?.grandTotal,
          eventsCount: (r.events || existingFullData.events || []).length,
          securityPin: existingFullData.securityPin,
        },
      });
    }

    // Post-migration database-level verification
    const { data: postRows, error: postErr } = await supabase.from('quotations').select('*');
    if (postErr || !postRows) {
      return NextResponse.json({ error: 'Post-verification failed to fetch database rows', details: postErr }, { status: 500 });
    }

    const postBusinessRows = postRows.filter(
      (r) =>
        r.id &&
        !r.id.startsWith('sys_') &&
        !r.full_data?.isSystemTaskRecord &&
        !r.full_data?.isSystemSettingsRecord &&
        !r.full_data?.isSystemServicesRecord
    );

    const afterCount = postBusinessRows.length;
    const isCountMatch = beforeCount === afterCount && afterCount === 6;

    return NextResponse.json({
      success: isCountMatch,
      beforeCount,
      afterCount,
      isCountMatch,
      updateResults,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Migration failed', message: err.message }, { status: 500 });
  }
}
