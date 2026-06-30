const CACHE_NAME = 'dgreatverse-v3'; // bump this number every time you deploy an update
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

// ═══════════════════════════════════════
// PUSH NOTIFICATIONS
// ═══════════════════════════════════════

// Fired when a push message arrives from the server, even if the app is closed.
self.addEventListener('push', function(event) {
  let payload = { title: 'DgreatVerse', body: 'You have a new message', url: '/Dgreatverse-/' };
  try {
    if (event.data) payload = event.data.json();
  } catch (e) {
    // If the push data isn't valid JSON, just use the default payload above.
  }

  const options = {
    body: payload.body,
    icon: '/Dgreatverse-/icon-192.png',
    badge: '/Dgreatverse-/icon-192.png',
    data: { url: payload.url || '/Dgreatverse-/' },
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// Fired when the user taps the notification — opens (or focuses) the app.
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/Dgreatverse-/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If the app is already open in a tab, just focus it instead of opening a new one.
      for (const client of clientList) {
        if (client.url.includes('/Dgreatverse-/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
