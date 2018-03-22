const staticCacheName = 'restaurant-static-v1';

self.addEventListener('install', (event) => {
    console.log('on install service worker');

    event.waitUntil(
        caches
            .open(staticCacheName)
            .then((cache) => {
                return cache.addAll([
                    '/',
                    'css/styles.css',
                    'js/dbhelper.js',
                    'js/main.js',
                    'js/restaurant_info.js',
                    'index.html',
                    ...addAllRestuarantPages(10)
                ]);
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('on activate service worker');
    var cacheWhitelist = [staticCacheName];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // console.log("fetching: ", event);
    let requestUrl = new URL(event.request.url);
    if (requestUrl.pathname.startsWith('/img')) {
        event.respondWith(handleImagesURL(event.request));
        return;
    }

    event.respondWith(
        caches
            .match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                let fetchRequest = event.request.clone();

                return fetch(fetchRequest)
                    .then((response) => {

                        if (response.status === 404) {
                            return caches.match('pages/404.html');
                        }

                        return caches.open(staticCacheName).then((cache) => {
                            cache.put(fetchRequest.url, response.clone());

                            return response;
                        });
                    });

            }).catch(function (error) {
            console.error('Error, ', error);
            return caches.match('pages/offline.html');
        })
    );
});

function addAllRestuarantPages(range) {
    let dynamicPagesURL = [];
    for (let i = 0; i <= range; i++) {
        i === 0 ? dynamicPagesURL.push('restaurant.html') : dynamicPagesURL.push(`restaurant.html?id=${i}`);
    }
    return dynamicPagesURL;
}

function handleImagesURL(request) {
    return caches
        .open('restaurant-images-v1')
        .then(cache => {
            return cache.match(request.url)
                .then(response => {
                    if (response) {
                        return response;
                    }

                    return fetch(request).then(response => {
                        cache.put(request.url, response.clone());
                        return response;
                    });
                });
        });
}
