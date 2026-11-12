import { NextResponse } from 'next/server';
import { getClientReviewsFromDb, saveClientReviewsToDb } from '@/lib/server-db';
import { ClientStory } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const reviews = await getClientReviewsFromDb();
    return NextResponse.json(
      { success: true, reviews },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching client reviews:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch client reviews' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reviews = body.reviews;

    if (!Array.isArray(reviews)) {
      return NextResponse.json(
        { success: false, error: 'Expected an array of reviews' },
        { status: 400 }
      );
    }

    const saved = await saveClientReviewsToDb(reviews as ClientStory[]);
    return NextResponse.json({ success: true, reviews: saved });
  } catch (error: any) {
    console.error('Error updating client reviews:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save client reviews' },
      { status: 500 }
    );
  }
}
