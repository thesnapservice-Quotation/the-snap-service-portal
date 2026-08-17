import { NextResponse } from 'next/server';
import { getQuotationsFromDb } from '@/lib/server-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const hasKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY);

  let quotationsCount = 0;
  let dbStatus = 'disconnected';
  let errorMsg = null;

  try {
    const list = await getQuotationsFromDb();
    quotationsCount = list.length;
    dbStatus = 'connected';
  } catch (e: any) {
    dbStatus = 'error';
    errorMsg = e?.message || String(e);
  }

  return NextResponse.json({
    status: dbStatus,
    supabaseConfigured: !!supabaseUrl && hasKey,
    supabaseUrl: supabaseUrl ? supabaseUrl.replace(/https?:\/\//, '').split('.')[0] + '.supabase.co' : 'not_set',
    totalQuotationsInDb: quotationsCount,
    error: errorMsg,
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    }
  });
}
