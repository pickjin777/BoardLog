/*
 * Last app shell for a reload while offline.
 * Navigations and static files are network-first, then stored. A failed navigation
 * falls back to the last HTML document. /api is never cached: photo scan and any
 * later server route must not be replayed from disk. Bump CACHE when this file's
 * strategy changes; activate drops every older boardlog-shell-* cache.
 */
const CACHE = 'boardlog-shell-v1';
const SHELL = '/';
const MAX_MESSAGE_URLS = 40;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(SHELL).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key.startsWith('boardlog-shell-') && key !== CACHE).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function sameOrigin(url) {
  return url.origin === self.location.origin;
}

function isApi(url) {
  return url.pathname === '/api' || url.pathname.startsWith('/api/');
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.webmanifest') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')
  );
}

async function storeIfOk(cache, key, response) {
  if (response && response.ok && response.type === 'basic') {
    await cache.put(key, response.clone());
    return true;
  }
  return false;
}

/* Vite marks scripts crossorigin, so the real request carries Origin while the stored
   one may not. The response says Vary: Origin, and a strict match then misses. */
const MATCH = { ignoreVary: true, ignoreSearch: true };

async function readCached(cache, request) {
  return (await cache.match(request, MATCH)) || (await cache.match(request.url, MATCH));
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (!sameOrigin(url) || isApi(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }
  if (!isStaticAsset(url)) return;
  event.respondWith(networkFirstAsset(request));
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (await storeIfOk(cache, request, response)) {
      await cache.put(SHELL, response.clone());
    }
    return response;
  } catch {
    const cached = (await readCached(cache, request)) || (await cache.match(SHELL, MATCH));
    if (cached) return cached;
    return new Response('오프라인 상태입니다.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

async function networkFirstAsset(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    await storeIfOk(cache, request, response);
    return response;
  } catch {
    const cached = await readCached(cache, request);
    if (cached) return cached;
    return new Response('', { status: 504, statusText: 'offline' });
  }
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'cache-urls' || !Array.isArray(data.urls)) return;
  const urls = data.urls.slice(0, MAX_MESSAGE_URLS);
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(
        urls.map(async (raw) => {
          let url;
          try {
            url = new URL(String(raw), self.location.origin);
          } catch {
            return;
          }
          if (!sameOrigin(url) || isApi(url)) return;
          if (url.pathname !== '/' && !isStaticAsset(url)) return;
          try {
            const response = await fetch(url.href, { cache: 'reload' });
            await storeIfOk(cache, url.href, response);
          } catch {
            // Already offline; keep whatever the previous visit stored.
          }
        })
      );
    })()
  );
});
