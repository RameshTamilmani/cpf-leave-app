// One production worker. Each deployment has its own complete offline release.
const RELEASE = __APP_RELEASE__;
const RELEASE_PREFIX = 'cutisg-release-';
const CACHE_NAME = RELEASE_PREFIX + RELEASE.buildId;
const STATE_CACHE = 'cutisg-update-state-v1';
const STATE_URL = '/__cutisg_approved_release';
const ASSETS = self.__WB_MANIFEST;

async function approvedRelease() {
  try {
    const response = await (await caches.open(STATE_CACHE)).match(STATE_URL);
    if (!response) return null;
    const data = await response.json();
    if (data?.cacheName) {
      const allKeys = await caches.keys();
      if (!allKeys.includes(data.cacheName)) return null;
      if (!await (await caches.open(data.cacheName)).match('/index.html')) return null;
    }
    return data;
  } catch {
    return null;
  }
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
  if (url.pathname === '/sw.js' || url.pathname === '/version.json' || url.pathname.startsWith('/api/')) return;
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
      try {
        const cache = await caches.open(CACHE_NAME);
        const cached = await Promise.all(ASSETS.map(asset => cache.match(new URL(asset.url, self.location.origin))));
        if (cached.some(response => !response)) {
          event.ports[0]?.postMessage({ approved: false, error: 'Update files are missing. Reconnect and check for updates again.' });
          return;
        }
        await saveApproval();
        await self.skipWaiting();
        event.ports[0]?.postMessage({ approved: true });
      } catch {
        event.ports[0]?.postMessage({ approved: false, error: 'Could not save update approval. Please try again.' });
      }
    })());
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }


});

// Wishes are rendered in the Home banner; legacy sync events no longer send them.
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
