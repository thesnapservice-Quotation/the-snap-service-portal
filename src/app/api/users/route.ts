import { NextResponse } from 'next/server';
import { getUsersFromDb, saveUserToDb } from '@/lib/server-db';
import { UserAccount } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const users = await getUsersFromDb();
    return NextResponse.json(
      { success: true, users },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('API GET /api/users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: UserAccount = await request.json();
    if (!body || !body.id || !body.email) {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }

    const updatedUsers = await saveUserToDb(body);
    return NextResponse.json(
      { success: true, user: body, users: updatedUsers },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('API POST /api/users error:', error);
    return NextResponse.json({ error: 'Failed to save user' }, { status: 500 });
  }
}
