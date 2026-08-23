import webpush from 'web-push';
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from './vapid-keys';
import { DeviceSubscription } from './types';
import { getDeviceSubscriptionsFromDb, deleteDeviceSubscriptionFromDb } from './server-db';

// Initialize Web Push VAPID Details
try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.error('Error setting VAPID details:', e);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    taskId?: string;
    type?: 'reminder' | 'overdue' | 'follow_up' | 'test' | 'new_task';
  };
}

/**
 * Deliver push notification to a specific Web Push device subscription
 */
export async function sendPushToSubscription(
  device: DeviceSubscription,
  payload: PushNotificationPayload
): Promise<{ success: boolean; shouldDelete?: boolean; error?: string }> {
  if (!device.subscription || !device.subscription.endpoint) {
    return { success: false, shouldDelete: true, error: 'Invalid subscription' };
  }

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/snap-service-logo.png',
    badge: payload.badge || '/icon.png',
    tag: payload.tag || `task-notif-${Date.now()}`,
    data: payload.data || { url: '/tasks' },
  });

  try {
    await webpush.sendNotification(device.subscription, pushPayload, {
      TTL: 86400, // 24 hours
      urgency: 'high',
    });
    return { success: true };
  } catch (error: any) {
    const errDetail = `${error?.statusCode || 'ERR'}: ${error?.body || error?.message || 'Push delivery failed'}`;
    console.error(`Push delivery error to ${device.deviceName} (${device.id}):`, errDetail);
    
    // Status 404 (Not Found) or 410 (Gone) indicates expired or revoked browser subscription
    if (error?.statusCode === 404 || error?.statusCode === 410) {
      return { success: false, shouldDelete: true, error: errDetail };
    }

    return { success: false, shouldDelete: false, error: errDetail };
  }
}

/**
 * Deliver push notification to ALL registered active devices belonging to a user
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number; total: number; details: any[] }> {
  if (!userId) return { sent: 0, failed: 0, total: 0, details: [] };

  const cleanUid = userId.trim().toLowerCase();
  const allSubscriptions = await getDeviceSubscriptionsFromDb(cleanUid);
  const activeSubscriptions = allSubscriptions.filter((d) => d.active);

  if (activeSubscriptions.length === 0) {
    return { sent: 0, failed: 0, total: 0, details: [] };
  }

  let sent = 0;
  let failed = 0;
  const details: any[] = [];

  await Promise.all(
    activeSubscriptions.map(async (device) => {
      const res = await sendPushToSubscription(device, payload);
      details.push({
        deviceId: device.id,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        endpointDomain: device.subscription?.endpoint ? new URL(device.subscription.endpoint).hostname : 'none',
        success: res.success,
        error: res.error,
      });
      if (res.success) {
        sent++;
      } else {
        failed++;
        if (res.shouldDelete) {
          try {
            await deleteDeviceSubscriptionFromDb(device.id);
          } catch {}
        }
      }
    })
  );

  return { sent, failed, total: activeSubscriptions.length, details };
}
