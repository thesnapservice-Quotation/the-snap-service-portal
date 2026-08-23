import { NextResponse } from 'next/server';
import { getSettingsFromDb, saveSettingsToDb } from '@/lib/server-db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId') || undefined;
    const settings = await getSettingsFromDb(userId);
    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json();
    const settings = body.settings || body;
    const userId = body.userId || url.searchParams.get('userId') || undefined;

    const saved = await saveSettingsToDb(settings, userId);
    return NextResponse.json(saved);
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
