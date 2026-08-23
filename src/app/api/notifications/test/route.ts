import { NextResponse } from 'next/server';
import { sendPushNotificationToUser } from '@/lib/push-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body?.userId || 'user-super-admin';
    const userName = body?.userName || 'Studio Admin';
    const title = body?.title || '🔔 Snap Service — Notification Connected!';
    const bodyText = body?.body || `Hello ${userName}! Push notifications are active and ready for task reminders.`;

    const result = await sendPushNotificationToUser(userId, {
      title,
      body: bodyText,
      icon: '/snap-service-logo.png',
      badge: '/icon.png',
      data: {
        url: body?.url || '/tasks',
        type: body?.type || 'test',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${result.sent} active device(s)`,
      result,
    });
  } catch (error: any) {
    console.error('API POST /api/notifications/test error:', error);
    return NextResponse.json({ error: 'Failed to send test push' }, { status: 500 });
  }
}
