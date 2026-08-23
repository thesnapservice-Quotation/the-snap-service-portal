import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';

// Snap Service Official Firebase Web App Configuration
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD5GdEiRMegN4SGa9lx15Cb2-Neb9-8UNs",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "portal-snap-service.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "portal-snap-service",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "portal-snap-service.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "487930286188",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:487930286188:web:4cfbb29e5ed89d3e054849",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-1WESV7NZ53"
};

// Initialize or reuse Firebase App instance safely (SSR compatible)
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

/**
 * Get Firebase Messaging instance in browser environment
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('Firebase Cloud Messaging is not supported in this browser environment');
      return null;
    }
    const app = getFirebaseApp();
    return getMessaging(app);
  } catch (error) {
    console.error('Error initializing Firebase Messaging:', error);
    return null;
  }
}

/**
 * Request FCM Device Token using service worker registration
 */
export async function requestFCMToken(
  vapidKey: string,
  serviceWorkerRegistration?: ServiceWorkerRegistration
): Promise<string | null> {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration,
    });

    return token || null;
  } catch (error) {
    console.error('Error retrieving FCM device token:', error);
    return null;
  }
}

/**
 * Listen for foreground push messages
 */
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  if (typeof window === 'undefined') return null;

  let unsubscribe: (() => void) | null = null;

  getFirebaseMessaging().then((messaging) => {
    if (messaging) {
      unsubscribe = onMessage(messaging, (payload) => {
        callback(payload);
      });
    }
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
}
