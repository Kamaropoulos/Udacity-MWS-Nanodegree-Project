var staticCache = "rr-static-v1";
var imgsCahce = "rr-imgs";

var allCaches = [
    staticCache,
    imgsCahce
];

self.addEventListener('install', function(event){
    var urlsToCache = [
        '/',
        'index.html',
        'restaurant.html',
        'css/styles.css',
        'js/idb.js',
        'js/db.js',
        'js/main.js',
        'js/dbhelper.js',
        'js/restaurant_info.js',
        'img/no-photo.png',
        'manifest.json',
        'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700',
        'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2',
        'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4WxKOzY.woff2',
        'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBxc4EsA.woff2'
    ];
    event.waitUntil(
        caches.open(staticCache).then(function(cache){
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.startsWith('rr-') &&
                    !allCaches.includes(cacheName);
                }).map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', function(event){
    var requestUrl = new URL(event.request.url);

    if (event.request.method == "POST") {
        if (!navigator.onLine) {
            // Store in queue
        } else {
            fetch(event.request);
        }
    } else {
        if (requestUrl.origin === location.origin) {
            if (requestUrl.pathname === '/') {
                event.respondWith(caches.match('/'));
                return;
            }
            if (requestUrl.pathname.startsWith('/img/')) {
                event.respondWith(serveImg(event.request));
                return;
            }
        }
    
        event.respondWith(
            caches.match(event.request).then(function(response){
                return response || fetch(event.request);
            })
        )
    }

    if (navigator.onLine) {
        // Replay stored POST requests (if any)
    }
});

function serveImg(request) {
    var storageUrl = request.url.replace(/_\d+(?:\.\d+)?x\.jpg$/, '');

    return caches.open(imgsCahce).then(function(cache) {
        return cache.match(storageUrl).then(function(response) {
            if (response) return response;

            return fetch(request).then(function(networkResponse) {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            })
        })
    })
}