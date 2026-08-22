import { NextResponse } from 'next/server';
import { getSettingsFromDb, saveSettingsToDb } from '@/lib/server-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getSettingsFromDb();
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
    const body = await req.json();
    const saved = await saveSettingsToDb(body);
    return NextResponse.json(saved);
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
