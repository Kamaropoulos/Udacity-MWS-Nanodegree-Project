importScripts("/js/idb.js");
importScripts("/js/db.js");

var staticCache = "rr-static-v1";
var imgsCahce = "rr-imgs";

var allCaches = [
    staticCache,
    imgsCahce
];

self.addEventListener('install', function (event) {
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
        caches.open(staticCache).then(function (cache) {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('rr-') &&
                        !allCaches.includes(cacheName);
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', function (event) {
    var requestUrl = new URL(event.request.url);

    if (event.request.method == "POST") {
        if (!navigator.onLine) {
            storeReviewInQueue(event.request);
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
        } else if (requestUrl.href.endsWith(':1337/restaurants')) {
            event.respondWith(getRestaurantsFromIDB(event.request));
            event.waitUntil(fetchNewRestaurants(event.request));
        } else if (requestUrl.href.indexOf(':1337/restaurants/') !== -1) {
            event.respondWith(getRestaurantFromIDB(event.request));
            event.waitUntil(fetchNewRestaurants(event.request));
        } else if (requestUrl.href.indexOf(':1337/reviews/?restaurant_id=') !== -1) {
            event.respondWith(getReviewsFromIDB(event.request));
            event.waitUntil(fetchNewReviews(event.request));
        } else {
            event.respondWith(
                caches.match(event.request).then(function (response) {
                    return response || fetch(event.request);
                })
            );
        }
    }

    if (navigator.onLine) {
        replayStoredReviews();
    }
});

function getRestaurantsFromIDB(request) {
    return restaurantsDB.getAll().then((val) => {
        return new Response(JSON.stringify(val), {
            headers: {'Content-Type': 'application/json'}
        });
    });
}

function getRestaurantFromIDB(request) {
    console.log("getRestaurantFromIDB");
    console.log(request);
}

function getReviewsFromIDB(request) {
    console.log("getReviewsFromIDB");
    console.log(request);
}

function fetchNewRestaurants(request) {
    return fetch(request).then(function (networkResponse) {
        networkResponse.clone().json().then(data => {
          for (const key in data) {
              if (data.hasOwnProperty(key)) {
                  const restaurant = data[key];
                  restaurantsDB.set(restaurant.id, restaurant);
              }
          }
        });
        return networkResponse;
    });
}

function fetchNewReviews(request) {
    console.log("fetchNewReviews");
    console.log(request);
}

function storeReviewInQueue(request) {
    console.log("storeReviewInQueue");
    console.log(request);
}

function replayStoredReviews() {
    console.log("replayStoredReviews");
}

function serveImg(request) {
    var storageUrl = request.url.replace(/_\d+(?:\.\d+)?x\.jpg$/, '');

    return caches.open(imgsCahce).then(function (cache) {
        return cache.match(storageUrl).then(function (response) {
            if (response) return response;

            return fetch(request).then(function (networkResponse) {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            })
        })
    })
}