const CACHE_NAME = 'tuqio-gate-v2';

const SHELL_FILES = [
    './',
    './index.php',
    './css/app.css',
    './js/api.js',
    './js/auth.js',
    './js/events.js',
    './js/scanner.js',
    './js/checkin.js',
    './js/app.js',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/logo-white.svg',
    'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // API calls always go to network — check-in data must never be stale
    if (url.pathname.includes('/api/gate')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // App shell: cache-first
    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request))
    );
});
