// One production worker. Each deployment has its own complete offline release.
const RELEASE = __APP_RELEASE__;
const RELEASE_PREFIX = 'cutisg-release-';
const CACHE_NAME = RELEASE_PREFIX + RELEASE.buildId;
const STATE_CACHE = 'cutisg-update-state-v1';
const STATE_URL = '/__cutisg_approved_release';
const ASSETS = self.__WB_MANIFEST;

async function approvedRelease() {
  const response = await (await caches.open(STATE_CACHE)).match(STATE_URL);
  return response ? response.json() : null;
}
async function saveApproval() {
  await (await caches.open(STATE_CACHE)).put(STATE_URL,
    new Response(JSON.stringify({ cacheName: CACHE_NAME, release: RELEASE })));
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      await Promise.all(ASSETS.map(async asset => {
        const url = new URL(asset.url, self.location.origin);
        const requestURL = new URL(url);
        if (asset.revision) requestURL.searchParams.set('__revision', asset.revision);
        const response = await fetch(requestURL, { cache: 'reload' });
        if (!response.ok) throw new Error('Offline asset unavailable: ' + url.pathname);
        await cache.put(url, response);
      }));
      // First installation or migration from the legacy worker. Later releases
      // stay unapproved, even if the browser activates them after all tabs close.
      if (!await approvedRelease()) await saveApproval();
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/sw.js' || url.pathname === '/version.json') return;
  event.respondWith((async () => {
    const approved = await approvedRelease();
    if (approved) {
      const cache = await caches.open(approved.cacheName);
      const key = event.request.mode === 'navigate' ? '/index.html' : url.pathname;
      const cached = await cache.match(key);
      if (cached) return cached;
    }
    // Existing tabs may still need a hashed asset from an earlier release.
    if (url.pathname.startsWith('/assets/')) {
      for (const name of await caches.keys()) {
        if (!name.startsWith(RELEASE_PREFIX)) continue;
        const cached = await (await caches.open(name)).match(url.pathname);
        if (cached) return cached;
      }
    }
    return fetch(event.request);
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'GET_RELEASE') {
    event.ports[0]?.postMessage(RELEASE);
  }
  if (event.data?.type === 'APPROVE_UPDATE') {
    event.waitUntil((async () => {
      await saveApproval();
      await self.skipWaiting();
      event.ports[0]?.postMessage({ approved: true });
    })());
  }
  if (event.data?.type === 'CHECK_HOLIDAY_NOTIFICATIONS') {
    event.waitUntil(triggerHolidayPushNotification());
  }
});

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
