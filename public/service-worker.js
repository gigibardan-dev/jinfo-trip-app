const CACHE_NAME = 'jinfoapp-v2'; // Increment version pentru force update
const RUNTIME_CACHE = 'jinfoapp-runtime-v2';

// Essential assets
const ESSENTIAL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/jinfologo.png',
];

// Install
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v2...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching essential assets');
      return cache.addAll(ESSENTIAL_URLS);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v2...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch - IMPORTANT: CACHE EVERYTHING
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome-extension and non-http
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // === STRATEGY 1: HTML Pages - Network First ===
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          console.log('[SW] Network success for HTML:', url.pathname);
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch((error) => {
          console.log('[SW] Network failed for HTML, trying cache:', url.pathname);
          return caches.match(request).then((cached) => {
            if (cached) {
              console.log('[SW] Cache HIT for HTML:', url.pathname);
              return cached;
            }
            console.log('[SW] No cache for HTML:', url.pathname);
            return caches.match('/index.html');
          });
        })
    );
    return;
  }

  // === STRATEGY 2: Supabase API - Network First, Cache Fallback ===
  if (url.hostname.includes('supabase.co')) {
    // IMPORTANT: Cache API responses aggressively
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok && request.method === 'GET') {
            console.log('[SW] Caching API response:', url.pathname);
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch((error) => {
          console.log('[SW] API request failed, checking cache:', url.pathname);
          
          // Return cached version
          return caches.match(request).then((cached) => {
            if (cached) {
              console.log('[SW] Cache HIT for API:', url.pathname);
              return cached;
            }
            
            console.log('[SW] No cache for API:', url.pathname);
            // Return empty error response
            return new Response(
              JSON.stringify({ 
                error: 'Offline - no cached data',
                offline: true,
                data: null
              }),
              {
                status: 503,
                statusText: 'Service Unavailable - Offline',
                headers: { 
                  'Content-Type': 'application/json',
                  'X-Offline': 'true'
                }
              }
            );
          });
        })
    );
    return;
  }

  // === STRATEGY 3: JS/CSS/Assets - Cache First ===
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.url.includes('/assets/') ||
    request.url.match(/\.(js|css|png|jpg|jpeg|svg|woff|woff2)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Return cache immediately, update in background
          fetch(request)
            .then((response) => {
              if (response.ok) {
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(request, response.clone());
                });
              }
            })
            .catch(() => {
              // Ignore network errors for cached assets
            });
          return cached;
        }

        // Not cached, fetch and cache
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // === DEFAULT: Network First ===
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.method === 'GET') {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Message handler
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
