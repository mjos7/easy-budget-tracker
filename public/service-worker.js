const APP_PREFIX = 'EasyBudgetTracker-';
const VERSION = 'version_01';
const STATIC_CACHE = `static-cache-v1`;
const RUNTIME_CACHE = `runtime-cache`;
const FILES_TO_CACHE = [
  '/',
  './index.html',
  './css/styles.css',
  './js/index.js',
  './js/idb.js',
  './api/transaction',
  './manifest.webmanifest',
  './icons/icon-512x512.png',
  './icons/icon-384x384.png',
  './icons/icon-192x192.png',
  './icons/icon-152x152.png',
  './icons/icon-144x144.png',
  './icons/icon-128x128.png',
  './icons/icon-96x96.png',
  './icons/icon-72x72.png',
  // 'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/fonts/fontawesome-webfont.woff?v=4.7.0',
  // 'https://cdn.jsdelivr.net/npm/chart.js@2.8.0',
  // 'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
];

self.addEventListener(`install`, event => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener(`activate`, event => {
  const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames =>
        // return array of cache names that are old to delete
        cacheNames.filter(cacheName => !currentCaches.includes(cacheName))
      )
      .then(cachesToDelete =>
        Promise.all(
          cachesToDelete.map(cacheToDelete => caches.delete(cacheToDelete))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener(`fetch`, event => {
  if (
    event.request.method !== `GET` ||
    !event.request.url.startsWith(self.location.origin)
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (event.request.url.includes(`/api/transaction`)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache =>
        fetch(event.request)
          .then(response => {
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => caches.match(event.request))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return caches
        .open(RUNTIME_CACHE)
        .then(cache =>
          fetch(event.request).then(response =>
            cache.put(event.request, response.clone()).then(() => response)
          )
        );
    })
  );
});
