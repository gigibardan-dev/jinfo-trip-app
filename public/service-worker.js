const CACHE_NAME = 'jinfoapp-v1';
const RUNTIME_CACHE = 'jinfoapp-runtime';

// Assets statice esențiale (cache immediate)
const ESSENTIAL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/jinfologo.png',
  '/offline.html',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching essential assets');
      return cache.addAll(ESSENTIAL_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Strategy 1: HTML - Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful response
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request).then((cached) => {
            return cached || caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // Strategy 2: JS/CSS Chunks - Cache First, Network Fallback
  if (
    request.url.includes('/assets/') ||
    request.url.includes('.js') ||
    request.url.includes('.css')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        // Return cached version if exists
        if (cached) {
          // Update cache in background
          fetch(request).then((response) => {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, response.clone());
            });
          }).catch(() => {
            // Network failed, but we have cache - all good
          });
          return cached;
        }

        // Not in cache - fetch and cache
        return fetch(request).then((response) => {
          // Cache the chunk
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Strategy 3: API Calls - Network First, Cache Fallback
  if (request.url.includes('/rest/v1/') || request.url.includes('/functions/v1/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Verifică că response e OK înainte de cache
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          console.log('[SW] Network failed, returning cache for:', request.url);
          // Fallback to cache
          return caches.match(request).then((cached) => {
            if (cached) {
              console.log('[SW] Cache hit:', request.url);
              return cached;
            }
            // No cache available - return error response
            console.log('[SW] No cache for:', request.url);
            return new Response(
              JSON.stringify({ 
                error: 'Offline and no cache available',
                offline: true 
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Strategy 4: Images/Documents - Cache First
  if (
    request.url.includes('/storage/v1/') ||
    request.destination === 'image' ||
    request.url.includes('.png') ||
    request.url.includes('.jpg') ||
    request.url.includes('.pdf')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
            return response;
          })
        );
      })
    );
    return;
  }

  // Default: Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Message handler pentru force refresh
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
