/**
 * Service Worker Registration
 * Registers the service worker for PWA offline support
 */

export async function registerServiceWorker(): Promise<void> {
  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Workers not supported');
    return;
  }

  try {
    // Wait for the page to load
    await new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve(true);
      } else {
        window.addEventListener('load', resolve);
      }
    });

    // Register the service worker
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });

    console.log('[SW] Registration successful:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[SW] New version available! Refresh to update.');
          
          // Optional: Show update notification to user
          if (window.confirm('New version available! Refresh to update?')) {
            window.location.reload();
          }
        }
      });
    });

    // Check for updates periodically (every hour)
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

  } catch (error) {
    console.error('[SW] Registration failed:', error);
  }
}

/**
 * Unregister service worker (for development/debugging)
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      await registration.unregister();
      console.log('[SW] Unregistered:', registration.scope);
    }
  } catch (error) {
    console.error('[SW] Unregistration failed:', error);
  }
}

/**
 * Check if app is running in standalone mode (installed as PWA)
 */
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

/**
 * Check online/offline status
 */
export function checkOnlineStatus(): void {
  // Initial status log
  console.log(`[SW] Initial network status: ${navigator.onLine ? 'online' : 'offline'}`);

  window.addEventListener('online', () => {
    console.log('[SW] Back online - IndexedDB sync will be triggered');
    // The useNetworkSync hook will handle the actual sync
    
    // Optional: Trigger background sync if supported
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        (registration as any).sync.register('sync-offline-data').catch((err: Error) => {
          console.log('[SW] Background sync registration failed:', err);
        });
      });
    }
  });

  window.addEventListener('offline', () => {
    console.log('[SW] Gone offline - cached documents still accessible via IndexedDB');
  });
}
