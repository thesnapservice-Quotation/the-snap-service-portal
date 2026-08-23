import { NextResponse } from 'next/server';
import { VAPID_PUBLIC_KEY } from '@/lib/vapid-keys';
import { 
  getDeviceSubscriptionsFromDb, 
  saveDeviceSubscriptionToDb, 
  deleteDeviceSubscriptionFromDb 
} from '@/lib/server-db';
import { DeviceSubscription } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;

    const subscriptions = await getDeviceSubscriptionsFromDb(userId);

    return NextResponse.json({
      success: true,
      publicKey: VAPID_PUBLIC_KEY,
      subscriptions,
    });
  } catch (error: any) {
    console.error('API GET /api/notifications/subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification config', publicKey: VAPID_PUBLIC_KEY },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || !body.subscription || !body.subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid push subscription' }, { status: 400 });
    }

    const deviceId = body.id || `dev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const deviceSub: DeviceSubscription = {
      id: deviceId,
      userId: body.userId || 'user-super-admin',
      userName: body.userName || 'Studio Admin',
      userEmail: body.userEmail,
      deviceType: body.deviceType || 'browser',
      deviceName: body.deviceName || 'Web Browser',
      userAgent: body.userAgent || '',
      subscription: body.subscription,
      fcmToken: body.fcmToken,
      active: true,
      createdAt: body.createdAt || now,
      updatedAt: now,
    };

    const saved = await saveDeviceSubscriptionToDb(deviceSub);

    return NextResponse.json({
      success: true,
      device: saved,
      message: 'Device push notification registered successfully',
    });
  } catch (error: any) {
    console.error('API POST /api/notifications/subscribe error:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('endpoint');
    if (!id) {
      return NextResponse.json({ error: 'Device ID or endpoint required' }, { status: 400 });
    }

    await deleteDeviceSubscriptionFromDb(id);
    return NextResponse.json({ success: true, message: 'Device unsubscribed' });
  } catch (error: any) {
    console.error('API DELETE /api/notifications/subscribe error:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}
