import { NextResponse } from 'next/server';
import { sendPushNotificationToUser } from '@/lib/push-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body?.userId || 'user-super-admin';
    const userName = body?.userName || 'Studio Admin';

    const result = await sendPushNotificationToUser(userId, {
      title: '🔔 Snap Service — Notification Connected!',
      body: `Hello ${userName}! Push notifications are active and ready for task reminders.`,
      icon: '/snap-service-logo.png',
      badge: '/icon.png',
      data: {
        url: '/tasks',
        type: 'test',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Test notification sent to ${result.sent} active device(s)`,
      result,
    });
  } catch (error: any) {
    console.error('API POST /api/notifications/test error:', error);
    return NextResponse.json({ error: 'Failed to send test push' }, { status: 500 });
  }
}
