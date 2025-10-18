const CACHE_NAME = 'travelpro-v1';
const RUNTIME_CACHE = 'travelpro-runtime-v1';

// App Shell - Core files and main routes to precache
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/documents',
  '/itinerary',
  '/messages',
  '/trips',
  '/guides',
  '/settings',
  '/guide-dashboard',
  '/guide-itinerary',
  '/guide-reports',
  '/guide-documents',
  '/guide-messages'
];

// Install event - precache app shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => self.skipWaiting())
  );
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
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Network First for Supabase API calls
  if (url.origin.includes('supabase') || url.pathname.startsWith('/api')) {
    event.respondWith(
      networkFirstStrategy(request)
    );
    return;
  }

  // Cache First for static assets (JS, CSS, images, fonts)
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    event.respondWith(
      cacheFirstStrategy(request)
    );
    return;
  }

  // Network First with cache fallback for navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirstStrategy(request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Default: Network First
  event.respondWith(
    networkFirstStrategy(request)
  );
});

// Cache First Strategy
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('[Service Worker] Cache hit:', request.url);
    return cachedResponse;
  }

  console.log('[Service Worker] Cache miss, fetching:', request.url);
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    throw error;
  }
}

// Network First Strategy
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-reports' || event.tag === 'sync-forms') {
    event.waitUntil(
      // Future: sync offline data from IndexedDB
      Promise.resolve()
    );
  }
});

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico'
  };
  
  event.waitUntil(
    self.registration.showNotification('TravelPro', options)
  );
});
