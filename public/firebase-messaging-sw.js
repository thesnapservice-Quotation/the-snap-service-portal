// Snap Service — Firebase Cloud Messaging & Web Push Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase in Service Worker
firebase.initializeApp({
  apiKey: "AIzaSyD5GdEiRMegN4SGa9lx15Cb2-Neb9-8UNs",
  authDomain: "portal-snap-service.firebaseapp.com",
  projectId: "portal-snap-service",
  storageBucket: "portal-snap-service.firebasestorage.app",
  messagingSenderId: "487930286188",
  appId: "1:487930286188:web:4cfbb29e5ed89d3e054849",
  measurementId: "G-1WESV7NZ53"
});

const messaging = firebase.messaging();

// Handle Background Firebase Messages
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || payload.data?.title;
  const notificationBody = payload.notification?.body || payload.data?.body;

  if (!notificationTitle && !notificationBody) {
    return;
  }

  const notificationOptions = {
    body: notificationBody || '',
    icon: payload.notification?.icon || '/snap-service-logo.png',
    badge: '/icon.png',
    data: {
      url: payload.data?.url || '/tasks',
      taskId: payload.data?.taskId,
    },
    vibrate: [100, 50, 100],
    requireInteraction: true,
    actions: [
      { action: 'open_task', title: 'Open Task' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  return self.registration.showNotification(notificationTitle || 'Snap Service', notificationOptions);
});

// Also include standard Web Push listener for direct VAPID delivery
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    // If handled by firebase-messaging, skip duplicate
    if (data.notification || data.fcmMessageId) {
      return;
    }

    const options = {
      body: data.body || 'You have a studio task reminder.',
      icon: data.icon || '/snap-service-logo.png',
      badge: data.badge || '/icon.png',
      data: data.data || { url: '/tasks' },
      vibrate: [100, 50, 100],
      requireInteraction: true,
      actions: [
        { action: 'open_task', title: 'Open Task' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };

    event.waitUntil(self.registration.showNotification(data.title || 'Snap Service Reminder', options));
  } catch (e) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Snap Service Reminder', {
        body: text,
        icon: '/snap-service-logo.png',
        badge: '/icon.png',
      })
    );
  }
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/tasks';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
