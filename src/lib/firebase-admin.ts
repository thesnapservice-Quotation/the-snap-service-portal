import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getMessaging, Message } from 'firebase-admin/messaging';

// Initialize Firebase Admin SDK singleton (SSR safe)
export function getFirebaseAdminApp(): App | null {
  if (getApps().length > 0) {
    return getApp();
  }

  // 1. Try FIREBASE_SERVICE_ACCOUNT JSON string from environment variable
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (serviceAccountJson) {
    try {
      const parsed = typeof serviceAccountJson === 'string' ? JSON.parse(serviceAccountJson) : serviceAccountJson;
      return initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id || 'portal-snap-service',
      });
    } catch (e) {
      console.error('[Firebase Admin] Error parsing FIREBASE_SERVICE_ACCOUNT JSON:', e);
    }
  }

  // 2. Try individual environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'portal-snap-service';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } catch (e) {
      console.error('[Firebase Admin] Error initializing with individual env vars:', e);
    }
  }

  // 3. Fallback to default application credentials if running in Google Cloud / Firebase environment
  try {
    return initializeApp({
      projectId,
    });
  } catch (e) {
    console.warn('[Firebase Admin] Notice: Firebase Admin not initialized with custom credentials. Set FIREBASE_SERVICE_ACCOUNT in environment.');
    return null;
  }
}

/**
 * Send push notification to a specific FCM device token via Firebase Admin SDK
 */
export async function sendFCMMessage(
  fcmToken: string,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
    taskId?: string;
    type?: string;
  }
): Promise<{ success: boolean; shouldDelete?: boolean; error?: string; messageId?: string }> {
  const app = getFirebaseAdminApp();
  if (!app) {
    return { success: false, error: 'Firebase Admin SDK not configured on server (Missing FIREBASE_SERVICE_ACCOUNT)' };
  }

  const message: Message = {
    token: fcmToken,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      url: payload.url || '/tasks',
      taskId: payload.taskId || '',
      type: payload.type || 'reminder',
      title: payload.title,
      body: payload.body,
    },
    webpush: {
      fcmOptions: {
        link: payload.url || '/tasks',
      },
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/snap-service-logo.png',
        badge: payload.badge || '/icon.png',
        requireInteraction: true,
        vibrate: [100, 50, 100],
        actions: [
          { action: 'open_task', title: 'Open Task' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
      },
    },
  };

  try {
    const messaging = getMessaging(app);
    const response = await messaging.send(message);
    console.log('[Firebase Admin] ✅ FCM message delivered successfully. Message ID:', response);
    return { success: true, messageId: response };
  } catch (error: any) {
    console.error('[Firebase Admin] ❌ FCM send error:', error?.code || error?.message);
    
    // Check if token is invalid or unregistered (uninstalled app or expired token)
    const isUnregistered = 
      error?.code === 'messaging/registration-token-not-registered' ||
      error?.code === 'messaging/invalid-registration-token' ||
      error?.code === 'messaging/invalid-argument';

    return {
      success: false,
      shouldDelete: isUnregistered,
      error: error?.message || error?.code || 'FCM send failed',
    };
  }
}
