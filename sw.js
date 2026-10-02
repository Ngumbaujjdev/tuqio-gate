// Version comes from the registration URL (sw.js?v=APP_VERSION in index.php),
// so bumping APP_VERSION in config/config.php is the only step a release needs:
// a new ?v= makes the browser install this worker afresh under a new cache.
const VERSION    = new URL(self.location).searchParams.get('v') || 'dev';
const CACHE_NAME = `tuqio-gate-${VERSION}`;

const v = path => `${path}?v=${encodeURIComponent(VERSION)}`;

const SHELL_FILES = [
    './',
    v('./css/app.css'),
    v('./js/toast.js'),
    v('./js/api.js'),
    v('./js/auth.js'),
    v('./js/events.js'),
    v('./js/scanner.js'),
    v('./js/checkin.js'),
    v('./js/pwa.js'),
    v('./js/app.js'),
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/logo-white.svg',
    'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js',
];

self.addEventListener('install', event => {
    // cache: 'reload' skips the browser's HTTP cache (.htaccess gives JS/CSS a
    // week-long expiry), so a new version never gets seeded with old files.
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            cache.addAll(SHELL_FILES.map(url => new Request(url, { cache: 'reload' })))
        )
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

    // Page itself: network-first, so a fresh shell (carrying the new ?v=) is
    // what registers the next worker. Cached copy only when offline.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('./'))
        );
        return;
    }

    // Versioned JS/CSS + icons: cache-first
    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request))
    );
});
