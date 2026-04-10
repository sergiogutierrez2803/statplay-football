/**
 * StatPlay Football — sw.js (Production Grade)
 * Estrategia de caching por niveles:
 * 1. CSS/JS: Stale-While-Revalidate (prioridad velocidad con actualización en background)
 * 2. Imágenes/Logos: Cache-First (ahorro de datos, rara vez cambian)
 * 3. API: Network-Only (garantía de frescura en predicciones)
 */

const CACHE_NAME = 'statplay-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/components.css',
  '/css/animations.css',
  '/js/main.js',
  '/js/ui.js',
  '/js/api.js',
  '/js/i18n.js',
  '/js/engine.js',
  '/js/app.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 🔴 1. API - Network Only (Nunca cachear predicciones o datos vivos)
  const isApi = url.pathname.startsWith('/api/') || 
                ['/predict', '/upcoming', '/analysis', '/health'].some(p => url.pathname.includes(p));
  
  if (isApi || url.hostname.includes('railway.app')) {
    event.respondWith(fetch(event.request).catch(() => {
        // Fallback offline para la API si es posible (ej: mensaje JSON)
        return new Response(JSON.stringify({ error: 'Sin conexión para datos en vivo' }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }));
    return;
  }

  // 🟢 2. IMÁGENES/LOGOS - Cache First
  if (event.request.destination === 'image' || url.hostname.includes('api-sports.io') || url.hostname.includes('flagcdn.com')) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 🟡 3. CSS/JS/HTML - Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
      return cachedResponse || fetchPromise;
    })
  );
});

// Manejo offline general
self.addEventListener('message', event => {
  if (event.data === 'check-online') {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({ online: navigator.onLine }));
    });
  }
});
