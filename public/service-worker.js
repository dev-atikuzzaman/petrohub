// public/service-worker.js

const CACHE_NAME = 'petro-hub-v10';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', event => {
  console.log('📦 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('✅ Cache opened');
      return cache.addAll(urlsToCache);
    }).catch(err => {
      console.warn('⚠️ Cache installation failed:', err);
    })
  );
  self.skipWaiting();
});

// Fetch Event - Network First, then Cache
self.addEventListener('fetch', event => {
  // Skip cross-origin requests (Supabase API calls should always go to network)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Don't cache API/data requests, only static shell
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(response => {
          return response || new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});

// Activate Event
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

console.log('✅ Service Worker loaded');

// ============================================================
// পুশ নোটিফিকেশন — সার্ভার (api/send-push.js) থেকে পাঠানো পুশ ইভেন্ট
// এখানে ধরা হয় এবং ডিভাইসে notification হিসেবে দেখানো হয়
// ============================================================
self.addEventListener('push', (event) => {
  let payload = { title: 'Petro Knowledge Hub', body: 'নতুন নোটিফিকেশন', url: '/' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (e) {
    // ignore malformed payload, ডিফল্ট মেসেজ দেখানো হবে
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      data: { url: payload.url || '/' },
      vibrate: [100, 50, 100],
    })
  );
});

// নোটিফিকেশনে ক্লিক করলে অ্যাপ খুলে যাবে (আগে থেকে খোলা থাকলে সেটাতেই ফোকাস করবে)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
