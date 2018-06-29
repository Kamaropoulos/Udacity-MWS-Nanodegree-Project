self.addEventListener('install', function(event){
    var urlsToCache = [
        '/',
        '/restaurant.html',
        'css/styles.css',
        'js/main.js',
        'js/dbhelper.js',
        'data/restaurants.json',
        'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700',
        'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2',
        'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4WxKOzY.woff2',
        'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBxc4EsA.woff2'
    ];
    event.waitUntil(
        caches.open('restaurant-reviews-static-v1').then(function(cache){
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', function(event){
    event.respondWith(
        caches.match(event.request).then(function(response){
            return response || fetch(event.request);
        })
    )
});
