/*
 * VERITAS — Community Damage Certification Platform
 * Service Worker for offline-first PWA
 * Author: Sheldon K. Salmon (Aion System)
 * CERTUS Engine v1.0
 *
 * Caches the app shell and allows offline submission via IndexedDB.
 * Background sync pushes queued reports to Supabase when connectivity returns.
 */

const CACHE_NAME = 'veritas-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/simulator.html',   // CERTUS.AI — must be available offline
  '/certify.html',     // AION.CERTIFY — must be available offline
  '/manifest.json',
  // Leaflet — loaded from CDN; cached here for offline map rendering
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  // Note: Google Fonts returns opaque responses that cannot be cached reliably.
  // System font fallback is defined in CSS; fonts load when online only.
];

// Install event – cache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
      // addAll fails if any single request fails.
      // Fonts are excluded above to prevent install failure on first offline load.
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // activate immediately
});

// Activate event – clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('[SW] Deleting old cache:', key);
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim(); // take control of all clients
});

// Fetch event – serve from cache, fallback to network, cache fresh responses
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and unsupported schemes
  if (event.request.method !== 'GET') return;

  // Skip Supabase API calls — always go to network; IndexedDB handles offline state
  if (url.hostname.includes('supabase.co')) return;

  // For same-origin and allowed CDN requests: cache-first strategy
  if (url.origin === location.origin || ASSETS_TO_CACHE.includes(event.request.url)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) {
          return cached;
        }
        return fetch(event.request).then(response => {
          // Cache successful, non-opaque responses only
          if (response && response.status === 200 && response.type !== 'opaque') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        }).catch(() => {
          // Fallback to root shell if specific asset unavailable
          return caches.match('/');
        });
      })
    );
  }
  // All other requests (third-party CDNs, tile servers, etc.) go straight to network
});

// Background Sync — push queued offline reports to Supabase when connectivity returns
self.addEventListener('sync', event => {
  if (event.tag === 'veritas-sync-reports') {
    console.log('[SW] Background sync: veritas-sync-reports');
    event.waitUntil(syncQueuedReports());
  }
});

/*
 * syncQueuedReports()
 * Reads all unsynced reports from IndexedDB and POSTs each to Supabase.
 * On success, marks each report as synced. On failure, leaves in queue
 * for the next sync attempt — the browser will retry automatically.
 */
async function syncQueuedReports() {
  const db = await openVeritasDB();
  const tx = db.transaction('reports', 'readwrite');
  const store = tx.objectStore('reports');
  const allReports = await getAllFromStore(store);

  const unsynced = allReports.filter(r => !r.synced);
  if (unsynced.length === 0) {
    console.log('[SW] No unsynced reports found.');
    return;
  }

  console.log(`[SW] Syncing ${unsynced.length} queued report(s)...`);

  for (const report of unsynced) {
    try {
      const response = await fetch(
        `${self.SUPABASE_URL}/rest/v1/reports`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': self.SUPABASE_ANON,
            'Authorization': `Bearer ${self.SUPABASE_ANON}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(report)
        }
      );

      if (response.ok) {
        // Mark as synced in IndexedDB
        const updateTx = db.transaction('reports', 'readwrite');
        const updateStore = updateTx.objectStore('reports');
        report.synced = true;
        updateStore.put(report);
        console.log(`[SW] Report ${report.uuid} synced.`);
      } else {
        console.warn(`[SW] Report ${report.uuid} sync failed — status ${response.status}. Will retry.`);
      }
    } catch (err) {
      console.warn(`[SW] Network error syncing report ${report.uuid}:`, err);
      // Do not mark as synced — browser retries the sync tag automatically
    }
  }
}

// IndexedDB helpers — minimal wrappers for use inside the service worker
function openVeritasDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('veritas-db', 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
