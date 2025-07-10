// Service Worker for Digital Signage Display
const CACHE_NAME = 'digital-signage-v1.2';
const STATIC_CACHE = 'static-cache-v1';
const DYNAMIC_CACHE = 'dynamic-cache-v1';

// URLs to cache on install
const urlsToCache = [
  '/android/display.html',
  '/client/script.js',
  '/client/lib/fontawesome/all.min.css',
  '/socket.io/socket.io.js'
];

// Network-first strategy URLs
const networkFirstUrls = [
  '/api/content',
  '/api/devices'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Cache installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with fallback strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API requests with network-first strategy
  if (networkFirstUrls.some(path => url.pathname.includes(path))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Handle image uploads
  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // Handle static resources with cache-first strategy
  event.respondWith(cacheFirstStrategy(request));
});

// Network-first strategy for dynamic content
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache');
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page or default content
    if (request.url.includes('/api/content')) {
      return new Response(JSON.stringify({
        type: 'text',
        content: 'Offline Mode - Bağlantı bekleniyor...',
        timestamp: new Date().toISOString(),
        id: 'offline'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Cache-first strategy for static resources
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Failed to fetch:', request.url);
    throw error;
  }
}

// Handle background sync for content updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});

async function syncContent() {
  try {
    const response = await fetch('/api/content');
    const content = await response.json();
    
    // Store content in cache for offline use
    const cache = await caches.open(CACHE_NAME);
    await cache.put('/api/content', new Response(JSON.stringify(content)));
    
    console.log('Content synced successfully');
  } catch (error) {
    console.error('Content sync failed:', error);
  }
}
