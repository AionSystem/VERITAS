/*
 * VERITAS — Community Damage Certification Platform
 * Service Worker for offline-first PWA
 * Author: Sheldon K. Salmon (Aion System)
 * CERTUS Engine v1.0
 *
 * Caches the app shell and allows offline submission via IndexedDB.
 */

const CACHE_NAME = 'veritas-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  // Optional: add specific CSS/JS if externalized, but all is in index.html
  // Leaflet CSS/JS are loaded from CDN; we cache them separately.
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
];

// Install event – cache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching app shell');
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
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim(); // take control of all clients
});

// Fetch event – serve from cache, fallback to network, then cache fresh
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and unsupported schemes
  if (event.request.method !== 'GET') return;

  // For same-origin and allowed CDN requests, try cache first
  if (url.origin === location.origin || ASSETS_TO_CACHE.includes(event.request.url)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) {
          return cached;
        }
        return fetch(event.request).then(response => {
          // Cache successful responses for future offline use
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        }).catch(() => {
          // Optional: fallback to a custom offline page
          return caches.match('/');
        });
      })
    );
  }
  // For other requests (e.g., Supabase API), just go to network
});