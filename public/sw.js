// 2BOTS Service Worker — minimal, enables PWA install prompt
// We intentionally do NOT cache API calls or audio streams

const CACHE_NAME = '2bots-v1';
const PRECACHE = ['/', '/icon.svg', '/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls, SSE streams, or audio
  if (
    url.pathname.startsWith('/api') ||
    url.origin !== self.location.origin ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // For navigation and static assets: network-first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
