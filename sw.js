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
        if (val) {
            return new Response(JSON.stringify(val), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return fetch(request);
        }
    });
}

function getRestaurantFromIDB(request) {
    // let id = request.url.substr(request.url.lastIndexOf('/') + 1);
    // console.log("id: " + id);
    // let data = restaurantsDB.get(id).then(val => console.log(val));
    // return restaurantsDB.get(id).then((val) => {
    //     console.log(JSON.stringify(val));
    //     return new Response(JSON.stringify(val), {
    //         headers: {'Content-Type': 'application/json'}
    //     });
    // });

    let id = request.url.substr(request.url.lastIndexOf('/') + 1);
    return restaurantsDB.getAll().then((val) => {
        if (val) {
            let result = val.filter(function (obj) {
                return obj.id == id;
            });
            let requestedRestaurant = result[0]
            if (requestedRestaurant) {
                return new Response(JSON.stringify(result[0]), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                return fetch(request);
            }
        } else {
            return fetch(request);
        }
    });
}

function getReviewsFromIDB(request) {
    let id = request.url.substr(request.url.lastIndexOf('/') + 1);
    return reviewsDB.getAll().then((val) => {
        if (val) {
            let result = val.filter(function (obj) {
                return obj.restaurant_id == id;
            });
            let requestedRestaurant = result[0]
            if (requestedRestaurant) {
                return new Response(JSON.stringify(result[0]), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                return fetch(request);
            }
        } else {
            return fetch(request);
        }
    });
}

function calculateUpdates(oldData, newData) {

    /**
     * This is not 100% functional! (but it's good enough for now)
     * Right now, all it does is check if we stored any restaurants before, if no,
     * then it stores everything it got. It does not take into account new restaurants
     * being added but since this is not a possibility at this point, it was skipped.
     * What it should do is find the elemnts on oldData that don't exist on the newData
     * and set them for deletion.Then, it should find the elements that exist on newData
     * but not on oldData and set them to be added to IDB.
     */

    let idsToBeDeleted = [];
    let itemsToBeAdded = [];

    // This is the first time we cache, store everything
    if (oldData.length == 0) {
        itemsToBeAdded = newData;
        return [idsToBeDeleted, itemsToBeAdded];
    }

    // If not
    return [idsToBeDeleted, itemsToBeAdded];
}

function fetchNewRestaurants(request) {
    return fetch(request).then(function (networkResponse) {
        networkResponse.clone().json().then(data => {
            restaurantsDB.getAll().then((oldRestaurants) => {
                if (oldRestaurants !== data) {
                    let idsToBeDeleted, restaurantsToBeAdded;
                    [idsToBeDeleted, restaurantsToBeAdded] = calculateUpdates(oldRestaurants, data);

                    if (idsToBeDeleted) {
                        for (const key in idsToBeDeleted) {
                            if (idsToBeDeleted.hasOwnProperty(key)) {
                                const idToDelete = idsToBeDeleted[key];
                                restaurantsDB.delete(idToDelete);
                            }
                        }
                    }

                    if (restaurantsToBeAdded) {
                        for (const key in restaurantsToBeAdded) {
                            if (restaurantsToBeAdded.hasOwnProperty(key)) {
                                const restaurantToBeAdded = restaurantsToBeAdded[key];
                                restaurantsDB.set(restaurantToBeAdded.id, restaurantToBeAdded);
                            }
                        }
                    }
                }
            })
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