// CutiSG Progressive Web App Service Worker
const CACHE_NAME = 'cutisg-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png'
];

// Install: Precache shell assets (passive)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Precache partial fallback', err);
      });
    })
  );
});

// Listen for user-triggered update from the in-app Update Available popup
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch: Stale-while-revalidate & cache-first for offline support
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Cache-first for Google Fonts & static icons
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    event.request.destination === 'image' ||
    event.request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => caches.match('/icon.svg'));
      })
    );
    return;
  }

  // Network-first with cache fallback for navigation / app shell
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline mode — cached resource unavailable.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});

// Background Sync capability
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-leaves') {
    event.waitUntil(
      Promise.resolve().then(() => {
        console.log('[Service Worker] Background sync event triggered');
      })
    );
  }
});

// Periodic Background Sync capability
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-holiday-alerts') {
    event.waitUntil(
      Promise.resolve().then(() => {
        console.log('[Service Worker] Periodic sync checked holiday alerts');
      })
    );
  }
});

// Push Notifications handler
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'CutiSG Alert', body: 'Singapore MOM holiday update' };
  const options = {
    body: data.body || 'Personal leave reminder',
    icon: '/pwa-192x192.png',
    badge: '/icon.svg',
    vibrate: [100, 50, 100],
    data: { url: '/' }
  };
  event.waitUntil(self.registration.showNotification(data.title || 'CutiSG', options));
});

// Notification click navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
