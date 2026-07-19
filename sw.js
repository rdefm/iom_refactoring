// Vein — service worker. Network-first with cache fallback: the game always
// updates when online, and still opens offline once visited.
const CACHE = 'vein-v3';
const PRECACHE = [
  '.',
  'index.html',
  'style.css',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'js/data.js',
  'js/state.js',
  'js/systems.js',
  'js/render-core.js',
  'js/save.js',
  'js/render-world.js',
  'js/render-events.js',
  'js/render-map.js',
  'js/render-craft-combat.js',
  'js/render-master.js',
  'js/main.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
