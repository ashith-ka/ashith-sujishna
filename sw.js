const CACHE_NAME = 'wedding-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/index-ml.html',
    '/memories.html',
    '/styles.css',
    '/memories.css',
    '/script.js',
    '/memories.js',
    '/assets/favicon.ico',
    '/assets/favicon.png',
    '/assets/favicon-1.png',
    '/assets/hero-video.webm',
    '/assets/bg-music.mp3',
    '/manifest.json'
];

const CACHE_STRATEGIES = {
    cacheFirst: [
        /\.(?:png|jpg|jpeg|svg|webp|ico)$/,
        /fonts\.googleapis\.com/,
        /cdnjs\.cloudflare\.com/,
        /jsdelivr\.net/
    ],
    networkFirst: [
        /.*/
    ],
    staleWhileRevalidate: [
        /.*\.json$/,
        /supabase/
    ]
};

function getCacheStrategy(url) {
    for (const pattern of CACHE_STRATEGIES.cacheFirst) {
        if (pattern.test(url)) return 'cache-first';
    }
    for (const pattern of CACHE_STRATEGIES.networkFirst) {
        if (pattern.test(url)) return 'network-first';
    }
    for (const pattern of CACHE_STRATEGIES.staleWhileRevalidate) {
        if (pattern.test(url)) return 'stale-while-revalidate';
    }
    return 'network-first';
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (url.origin !== location.origin && !url.protocol.startsWith('http')) {
        return;
    }

    const strategy = getCacheStrategy(url.href);

    switch (strategy) {
        case 'cache-first':
            event.respondWith(cacheFirst(request));
            break;
        case 'network-first':
            event.respondWith(networkFirst(request));
            break;
        case 'stale-while-revalidate':
            event.respondWith(staleWhileRevalidate(request));
            break;
        default:
            event.respondWith(networkFirst(request));
    }
});

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await caches.match(request);
        return cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request)
        .then((response) => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cached);

    return cached || fetchPromise;
}