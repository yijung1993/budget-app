const CACHE = 'budget-v5';
const ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png',
  './icons/home.png','./icons/calendar.png','./icons/assets.png','./icons/stats.png',
  './icons/history.png','./icons/insurance.png','./icons/settings.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // index.html：永遠先抓網路最新版，斷線才用快取
  if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html') || url.pathname === '/') {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // 其他資源：快取優先
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
