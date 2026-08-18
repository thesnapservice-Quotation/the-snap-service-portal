import { NextResponse } from 'next/server';
import { getQuotationsFromDb } from '@/lib/server-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_KEY ||
    ''
  ).trim();

  let quotationsCount = 0;
  let supabaseHttpStatus = null;
  let supabaseRawError = null;
  let rawRowsCount = 0;

  // Direct Supabase Ping
  if (supabaseUrl && supabaseKey) {
    try {
      const pingRes = await fetch(`${supabaseUrl}/rest/v1/quotations?select=id`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      supabaseHttpStatus = pingRes.status;
      if (pingRes.ok) {
        const data = await pingRes.json();
        rawRowsCount = Array.isArray(data) ? data.length : 0;
      } else {
        supabaseRawError = await pingRes.text();
      }
    } catch (e: any) {
      supabaseRawError = e?.message || String(e);
    }
  }

  try {
    const list = await getQuotationsFromDb();
    quotationsCount = list.length;
  } catch (e: any) {
    console.error('getQuotationsFromDb error', e);
  }

  return NextResponse.json({
    status: supabaseHttpStatus === 200 ? 'connected' : 'connection_issue',
    supabaseConfigured: !!(supabaseUrl && supabaseKey),
    supabaseUrl: supabaseUrl ? supabaseUrl.replace(/https?:\/\//, '').split('.')[0] + '.supabase.co' : 'not_set',
    supabaseHttpStatus,
    supabaseRawError,
    actualRowsInPostgres: rawRowsCount,
    totalQuotationsLoaded: quotationsCount,
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    }
  });
}
