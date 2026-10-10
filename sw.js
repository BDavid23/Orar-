// Service worker: face aplicația să meargă fără internet.
//
//  - Fișierele aplicației (HTML, JS, CSS, date) sunt luate întâi de pe net, ca să primești
//    mereu ultima versiune; dacă nu e net sau e prea lent (3 s), se folosește copia salvată.
//  - Fonturile și iconițele nu se schimbă, deci se iau direct din copia salvată.
//
// Când adaugi fișiere noi sau vrei să forțezi o curățare, mărește numărul din CACHE.

const CACHE = 'orar-v1';

const CORE = [
  './',
  'index.html',
  'style.css',
  'fonts.css',
  'app.js',
  'data.js',
  'manifest.webmanifest',
  'icons/apple-touch-icon.png',
  'icons/favicon-32.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];

const FONTS = [];
for (const slug of ['jetbrains-mono', 'ibm-plex-sans']) {
  for (const sub of ['latin', 'latin-ext']) {
    for (const w of [400, 500, 600, 700]) {
      FONTS.push(`fonts/${slug}-${sub}-${w}-normal.woff2`);
    }
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll([...CORE, ...FONTS]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    // no-cache = verifică mereu cu serverul (altfel hosting-ul poate servi ore întregi o versiune veche)
    const res = await fetch(request, { cache: 'no-cache', signal: ctrl.signal });
    clearTimeout(timer);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    clearTimeout(timer);
    const hit = await cache.match(request, { ignoreSearch: true });
    if (hit) return hit;
    if (request.mode === 'navigate') {
      const index = (await cache.match('index.html')) || (await cache.match('./'));
      if (index) return index;
    }
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res && res.ok) cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (/\.(woff2|png)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(req));
  } else {
    event.respondWith(networkFirst(req));
  }
});
