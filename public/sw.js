/*
 * VERITAS — Community Damage Certification Platform
 * Service Worker for offline-first PWA
 * Author: Sheldon K. Salmon (Aion System)
 * CERTUS Engine v2.5.2
 *
 * Caches the app shell and allows offline submission via IndexedDB.
 * Background sync pushes queued reports to Supabase when connectivity returns.
 */

const CACHE_NAME = 'veritas-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/certus-engine-v2.5.js',
  '/ai-analysis.js',
  '/manifest.json',
  // Leaflet — loaded from CDN; cached here for offline map rendering
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// ============================================================
// CRITICAL FIX: Supabase configuration
// These should match your actual Supabase credentials
// ============================================================
const SUPABASE_URL = 'https://spqqhvaqjwxcrdbujwna.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcXFodmFxand4Y3JkYnVqd25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwMjQwMTAsImV4cCI6MjA1NjYwMDAxMH0.PzY5zQgzN9kJgCm7jOyg2_-_k_axbUVHOmJ7Cxo5BTc'; // Your anon key

// Install event – cache essential assets
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('[SW] Caching app shell');
      // Cache each asset individually to prevent one failure from breaking all
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
          console.log(`[SW] Cached: ${asset}`);
        } catch (err) {
          console.warn(`[SW] Failed to cache ${asset}:`, err);
        }
      }
    })
  );
  self.skipWaiting(); // activate immediately
});

// Activate event – clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
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

// Fetch event – serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip Supabase API calls — always go to network
  if (url.hostname.includes('supabase.co')) return;
  
  // Skip OpenRouter API calls
  if (url.hostname.includes('openrouter.ai')) return;
  
  // Skip analytics and tracking
  if (url.hostname.includes('google-analytics')) return;
  
  // For same-origin and allowed CDN requests: cache-first strategy
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        console.log(`[SW] Serving from cache: ${url.pathname}`);
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
      }).catch(err => {
        console.warn(`[SW] Network failed for ${url.pathname}:`, err);
        // Fallback to root shell if specific asset unavailable
        if (url.pathname.endsWith('.html') || url.pathname === '/') {
          return caches.match('/index.html');
        }
        // Return a generic offline response
        return new Response('Offline — please check your connection', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
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
  try {
    const db = await openVeritasDB();
    const allReports = await getAllReports(db);
    
    const unsynced = allReports.filter(r => !r.synced);
    if (unsynced.length === 0) {
      console.log('[SW] No unsynced reports found.');
      return;
    }
    
    console.log(`[SW] Syncing ${unsynced.length} queued report(s)...`);
    
    for (const report of unsynced) {
      try {
        // Prepare payload matching your Supabase schema
        const payload = {
          uuid: report.uuid,
          timestamp: report.timestamp,
          lat: report.lat,
          lng: report.lng,
          undp_tier: report.undpTier,
          infra_type: report.infraType,
          dci: report.dci,
          dci_tier: report.dciTier,
          loc_mode: report.locMode,
          text_loc: report.textLocation || '',
          photo_ai_score: report.photoAiScore,
          photo_ai_conf: report.photoAiConf
        };
        
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/reports`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON,
              'Authorization': `Bearer ${SUPABASE_ANON}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(payload)
          }
        );
        
        if (response.ok) {
          // Mark as synced in IndexedDB
          await markReportSynced(db, report.uuid);
          console.log(`[SW] Report ${report.uuid} synced.`);
        } else {
          const errorText = await response.text();
          console.warn(`[SW] Report ${report.uuid} sync failed — ${response.status}: ${errorText}`);
        }
      } catch (err) {
        console.warn(`[SW] Network error syncing report ${report.uuid}:`, err);
        // Do not mark as synced — browser retries the sync tag automatically
      }
    }
  } catch (err) {
    console.error('[SW] Sync error:', err);
  }
}

// IndexedDB helpers
function openVeritasDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('veritas-db', 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('reports')) {
        db.createObjectStore('reports', { keyPath: 'uuid' });
      }
    };
  });
}

function getAllReports(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reports', 'readonly');
    const store = tx.objectStore('reports');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function markReportSynced(db, uuid) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('reports', 'readwrite');
    const store = tx.objectStore('reports');
    const req = store.get(uuid);
    req.onsuccess = () => {
      const report = req.result;
      if (report) {
        report.synced = true;
        store.put(report);
        resolve();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
}