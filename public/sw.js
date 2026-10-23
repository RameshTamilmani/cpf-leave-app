// CutiSG Progressive Web App Service Worker
// Version: 1.3.2
const CACHE_NAME = 'cutisg-cache-v1.3.2';

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

// Singapore 2026 Gazetted Public Holidays for Background & Push Notifications
const GAZETTED_HOLIDAYS_2026 = [
  { date: '2026-01-01', name: "New Year's Day", emoji: '🎆' },
  { date: '2026-02-17', name: 'Chinese New Year (Day 1)', emoji: '🧧' },
  { date: '2026-02-18', name: 'Chinese New Year (Day 2)', emoji: '🧧' },
  { date: '2026-03-21', name: 'Hari Raya Puasa', emoji: '🌙' },
  { date: '2026-04-03', name: 'Good Friday', emoji: '✝️' },
  { date: '2026-05-01', name: 'Labour Day', emoji: '🛠️' },
  { date: '2026-05-27', name: 'Hari Raya Haji', emoji: '🕌' },
  { date: '2026-05-31', name: 'Vesak Day', emoji: '🪷' },
  { date: '2026-06-01', name: 'Vesak Day (Observed)', emoji: '🪷' },
  { date: '2026-08-09', name: 'National Day', emoji: '🇸🇬' },
  { date: '2026-08-10', name: 'National Day (Observed)', emoji: '🇸🇬' },
  { date: '2026-11-08', name: 'Deepavali', emoji: '🪔' },
  { date: '2026-11-09', name: 'Deepavali (Observed)', emoji: '🪔' },
  { date: '2026-12-25', name: 'Christmas Day', emoji: '🎄' }
];

// Helper: Calculate current time in Indian Standard Time (IST, UTC+5:30)
function getCurrentIST() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istDate = new Date(utcMs + 5.5 * 3600000);
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  return {
    dateStr: `${year}-${month}-${day}`,
    dayOfWeek: istDate.getDay(), // 0 = Sun, 5 = Fri, 6 = Sat
    hours: istDate.getHours()
  };
}

// Install: Precache shell assets and activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial fallback', err);
      });
    })
  );
});

// Activate: Immediately purge old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Always serve live code when online, cache fallback for offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. NEVER intercept Vite dev server modules or source files
  if (
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('node_modules') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.jsx') ||
    url.search.includes('t=')
  ) {
    return;
  }

  // 2. Always fetch /version.json fresh from server (never cached)
  if (url.pathname.includes('/version.json')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => {
        return new Response(JSON.stringify({ version: '1.3.1', buildTime: Date.now() }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // 3. Navigation / HTML Requests: Network-First so preview and app updates display immediately
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const isLocalOrCloudRun =
              url.hostname.includes('localhost') ||
              url.hostname.includes('127.0.0.1') ||
              url.hostname.includes('run.app') ||
              url.port === '3000';
            if (!isLocalOrCloudRun) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', responseClone));
            }
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html').then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // 4. Static assets (fonts, images, manifest): Cache-First with network fallback
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
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        }).catch(() => caches.match('/icon.svg'));
      })
    );
    return;
  }

  // 5. Default: Network-First with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

// Background Check for Holiday & Weekend Wishes
async function triggerHolidayPushNotification() {
  const { dateStr, dayOfWeek, hours } = getCurrentIST();

  // 1. Weekend Wish (Friday 3PM IST through Sunday)
  const isWeekendActive = (dayOfWeek === 5 && hours >= 15) || dayOfWeek === 6 || dayOfWeek === 0;
  if (isWeekendActive) {
    const weekendTag = `cutisg-weekend-${dateStr.slice(0, 7)}-${dayOfWeek === 5 ? dateStr : 'weekend'}`;
    const existing = await self.registration.getNotifications({ tag: weekendTag });
    if (!existing || existing.length === 0) {
      await self.registration.showNotification('Happy Weekend! 🎉', {
        body: 'Wishing you a restful and joyful weekend from CutiSG!',
        icon: '/pwa-192x192.png',
        badge: '/icon.svg',
        tag: weekendTag,
        vibrate: [200, 100, 200],
        data: { url: '/' }
      });
      return;
    }
  }

  // 2. Singapore Public Holidays (Trigger on Same Day 8:00 AM IST)
  if (hours >= 8) {
    const holidayToday = GAZETTED_HOLIDAYS_2026.find((h) => h.date === dateStr);
    if (holidayToday) {
      const holidayTag = `cutisg-ph-${holidayToday.date}`;
      const existing = await self.registration.getNotifications({ tag: holidayTag });
      if (!existing || existing.length === 0) {
        await self.registration.showNotification(`Happy ${holidayToday.name}! ${holidayToday.emoji}`, {
          body: `Wishing you a wonderful ${holidayToday.name} holiday in Singapore!`,
          icon: '/pwa-192x192.png',
          badge: '/icon.svg',
          tag: holidayTag,
          vibrate: [200, 100, 200],
          data: { url: '/?tab=calendar' }
        });
      }
    }
  }
}

// Background Sync capability
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-holiday-alerts' || event.tag === 'sync-leaves') {
    event.waitUntil(triggerHolidayPushNotification());
  }
});

// Periodic Background Sync: Triggered periodically by mobile OS
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-holiday-alerts') {
    event.waitUntil(triggerHolidayPushNotification());
  }
});

// Real Web Push Notification handler
self.addEventListener('push', (event) => {
  let data = {
    title: 'CutiSG Alert',
    body: 'Singapore Public Holiday & Leave Reminder'
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    if (event.data) {
      data = { title: 'CutiSG', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'Upcoming holiday or leave update.',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/icon.svg',
    tag: data.tag || 'cutisg-push-alert',
    renotify: true,
    vibrate: [200, 100, 200, 100, 200],
    data: data.data || { url: '/' }
  };

  event.waitUntil(self.registration.showNotification(data.title || 'CutiSG', options));
});

// Client Message Dispatcher
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data.type === 'CHECK_HOLIDAY_NOTIFICATIONS') {
    event.waitUntil(triggerHolidayPushNotification());
  }
});

// Notification click navigation
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
