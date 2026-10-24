const CACHE_NAME = 'smartroute-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css'
];

// Install: Pre-cache core shell resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        // Some CDN assets might fail if offline during install; don't break installation
        console.warn('[ServiceWorker] Pre-cache partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up outdated caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy depending on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (e.g. POST /api/routes/recommend)
  if (request.method !== 'GET') {
    return;
  }

  // 1. Navigation (HTML document requests): Network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 2. Live API endpoints (/api/*): Network-only, with offline fallback for GET queries
  if (url.pathname.startsWith('/api/')) {
    // Traffic tiles can be cached for smoother map pan/zoom
    if (url.pathname.includes('/tiles/')) {
      event.respondWith(
        caches.match(request).then((cached) => {
          const fetchPromise = fetch(request).then((networkRes) => {
            if (networkRes.ok) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkRes;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      );
      return;
    }

    // Other API requests are network-first to guarantee live telemetry truth
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            offline: true,
            message: 'You are currently offline. Real-time traffic telemetry requires an active connection.'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 3. Static assets, CDN styles, fonts, and images: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((networkRes) => {
          if (networkRes.ok) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkRes;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
