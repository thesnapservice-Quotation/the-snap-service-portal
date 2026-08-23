import webpush from 'web-push';
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from './vapid-keys';
import { DeviceSubscription } from './types';
import { getDeviceSubscriptionsFromDb, deleteDeviceSubscriptionFromDb } from './server-db';
import { sendFCMMessage } from './firebase-admin';

// Initialize Web Push VAPID Details
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (e) {
    console.warn('[Web Push] Notice on VAPID setup:', e);
  }
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
    type?: 'reminder' | 'overdue' | 'follow_up' | 'test';
  };
}

/**
 * Deliver push notification to a device (Using Firebase Admin FCM or Web Push)
 */
export async function sendPushToDevice(
  device: DeviceSubscription,
  payload: PushNotificationPayload
): Promise<{ success: boolean; shouldDelete?: boolean; error?: string; method?: 'fcm' | 'webpush' }> {
  // 1. Primary Method: If device has an official FCM token, use Firebase Cloud Messaging
  if (device.fcmToken) {
    console.log(`[Push Server] 🚀 Attempting Firebase FCM delivery to ${device.deviceName} (${device.id})...`);
    const fcmRes = await sendFCMMessage(device.fcmToken, {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/snap-service-logo.png',
      badge: payload.badge || '/icon.png',
      url: payload.data?.url || '/tasks',
      taskId: payload.data?.taskId,
      type: payload.data?.type || 'reminder',
    });

    if (fcmRes.success) {
      console.log(`[Push Server] ✅ FCM delivery successful to ${device.deviceName}`);
      return { success: true, method: 'fcm' };
    } else {
      console.warn(`[Push Server] ⚠️ FCM delivery notice: ${fcmRes.error}. Trying Web Push fallback...`);
      if (fcmRes.shouldDelete) {
        return { success: false, shouldDelete: true, error: fcmRes.error, method: 'fcm' };
      }
    }
  }

  // 2. Secondary Method: Web Push Protocol via VAPID
  if (device.subscription && device.subscription.endpoint) {
    console.log(`[Push Server] 🌐 Attempting Web Push delivery to ${device.deviceName}...`);
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
      console.log(`[Push Server] ✅ Web Push delivery successful to ${device.deviceName}`);
      return { success: true, method: 'webpush' };
    } catch (error: any) {
      console.error(`[Push Server] ❌ Web Push error to ${device.deviceName}:`, error?.statusCode || error?.message);
      
      const isRevoked = error?.statusCode === 404 || error?.statusCode === 410;
      return {
        success: false,
        shouldDelete: isRevoked,
        error: error?.message || 'Web Push failed',
        method: 'webpush',
      };
    }
  }

  return { success: false, shouldDelete: true, error: 'No valid FCM token or Web Push subscription on device' };
}

/**
 * Deliver push notification to ALL registered active devices belonging to a user (strictly by authenticated userId)
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number; total: number; methods: string[] }> {
  if (!userId) return { sent: 0, failed: 0, total: 0, methods: [] };

  console.log(`[Push Server] 🔍 Fetching device subscriptions strictly for user ID: "${userId}"...`);
  
  // 1. Fetch subscriptions from database filtered strictly by userId
  const targetId = userId.trim().toLowerCase();
  const allUserSubscriptions = await getDeviceSubscriptionsFromDb(targetId);
  const activeSubscriptions = allUserSubscriptions.filter((d) => d.active);

  console.log(`[Push Server] 📱 Found ${activeSubscriptions.length} active device(s) for user ID "${userId}".`);

  if (activeSubscriptions.length === 0) {
    return { sent: 0, failed: 0, total: 0, methods: [] };
  }

  let sent = 0;
  let failed = 0;
  const methods: string[] = [];

  await Promise.all(
    activeSubscriptions.map(async (device) => {
      console.log(`[Push Server] 📲 Sending to device: ${device.deviceName} (Device ID: ${device.id}, User ID: ${device.userId})`);
      const res = await sendPushToDevice(device, payload);
      if (res.success) {
        sent++;
        if (res.method) methods.push(res.method);
      } else {
        failed++;
        if (res.shouldDelete) {
          console.log(`[Push Server] 🧹 Purging invalid/unregistered device token: ${device.id} (${device.deviceName})`);
          try {
            await deleteDeviceSubscriptionFromDb(device.id);
          } catch {}
        }
      }
    })
  );

  console.log(`[Push Server] 📊 Dispatch complete for user ID "${userId}": ${sent} sent, ${failed} failed.`);
  return { sent, failed, total: activeSubscriptions.length, methods };
}
