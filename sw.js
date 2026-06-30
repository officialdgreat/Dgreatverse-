const CACHE_NAME = 'dgreatverse-v2'; // bump this number every time you deploy an update
const urlsToCache = [
  '/Dgreatverse-/',
  '/Dgreatverse-/index.html',
  '/Dgreatverse-/manifest.json'
];

self.addEventListener('install', function(event) {
  self.skipWaiting(); // activate new SW immediately instead of waiting
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) { return name !== CACHE_NAME; })
                  .map(function(name) { return caches.delete(name); }) // wipe old caches
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  // NETWORK FIRST: always try to get the latest file from GitHub.
  // Only fall back to the cached copy if the network request fails (offline).
  event.respondWith(
    fetch(event.request)
      .then(function(networkResponse) {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      })
      .catch(function() {
        return caches.match(event.request);
      })
  );
});
