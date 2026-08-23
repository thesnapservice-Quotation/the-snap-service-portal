// Snap Service — Service Worker & Web Push Engine
const CACHE_NAME = 'snap-service-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for incoming Web Push Notifications in background
self.addEventListener('push', (event) => {
  let data = null;

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data = { body: event.data.text() };
    }
  }

  if (!data || (!data.title && !data.body)) {
    return;
  }

  const title = data.title || 'Snap Service';
  const options = {
    body: data.body || '',
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

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listen for notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/tasks';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a portal window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
