/* Service Worker for Xvshuo 叙说
 * 策略:
 *  - HTML 文档 (navigate requests) → Network-First（保证每次拿到最新版本）
 *  - 带 ?v= 版本号 query 的静态资源 → Cache-First（immutable）
 *  - 其他静态资源 → Stale-While-Revalidate
 *  - API 请求 → 不缓存（透传）
 */

const APP_VERSION = '1.0.3';
const CACHE_NAME = 'xvshuo-v' + APP_VERSION;

// 预缓存 app shell（不带版本号的会被 HTML 重新引用时刷新）
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles/tokens.css?v=' + APP_VERSION,
  '/styles/base.css?v=' + APP_VERSION,
  '/styles/layout.css?v=' + APP_VERSION,
  '/styles/components.css?v=' + APP_VERSION,
  '/styles/pages.css?v=' + APP_VERSION,
  '/styles/editorial.css?v=' + APP_VERSION,
  '/styles/responsive.css?v=' + APP_VERSION,
  '/scripts/app.js?v=' + APP_VERSION,
  '/scripts/router.js?v=' + APP_VERSION,
  '/scripts/icons.js?v=' + APP_VERSION
];

// ===== 安装 =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 预缓存尽力而为，单个失败不阻塞整个 install
      return Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url).catch(() => null)));
    }).then(() => self.skipWaiting())
  );
});

// ===== 激活 =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// ===== Fetch 分发 =====
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 跨域请求（含 API）不动

  // 1) HTML 文档 → Network-First
  if (req.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 2) 带 ?v= 版本号的静态资源 → Cache-First
  if (url.search.includes('?v=')) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 3) 其他静态资源 → Stale-While-Revalidate
  event.respondWith(staleWhileRevalidate(req));
});

async function networkFirst(req) {
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(CACHE_NAME);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    const cached = await caches.match(req);
    return cached || caches.match('/index.html');
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const fresh = await fetch(req);
    const cache = await caches.open(CACHE_NAME);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    return cached || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req).then((fresh) => {
    cache.put(req, fresh.clone());
    return fresh;
  }).catch(() => cached);
  return cached || fetchPromise;
}

// ===== Push 通知（预留，需配合 VAPID 后端）=====
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { payload = { title: '叙说', body: event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(payload.title || '叙说', {
      body: payload.body || '',
      icon: '/assets/icons/icon-192.png',
      badge: '/assets/icons/icon-192.png',
      data: payload.data || {}
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(self.clients.openWindow(url));
});
