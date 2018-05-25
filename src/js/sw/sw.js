const staticCacheName = 'restaurant-static-v1';
const imagesCacheName = 'restaurant-images-v1';

self.addEventListener('install', (event) => {
	console.log('on install service worker');

	event.waitUntil(
		caches
			.open(staticCacheName)
			.then((cache) => {
				console.log('open cache: ', staticCacheName);
				return cache.addAll([
					'css/styles.css',
					'js/lib/idb.js',
					'js/main.js',
					'js/dbhelper.js',
					'js/restaurant_info.js',
					'index.html',
					'restaurant.html',
					...self.addAllRestaurantPages(10)
				]).then(() => {
					caches.open(imagesCacheName)
						.then((cache) => {
							console.log('open cache: ', imagesCacheName);
							return cache.addAll(self.addAllRestaurantImages(10));
						});
				});
			})
			.finally(() => console.log('finished with sw install')));
});

self.addEventListener('activate', (event) => {
	console.log('on activate service worker');
	let cacheWhitelist = [staticCacheName];
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
		event.respondWith(self.handleImagesURL(event.request));
		return;
	}

	if (event.request.method === 'GET' &&
		+    // Ensure that chrome-extension:// requests don't trigger the default route.
			+event.request.url.indexOf('http') === 0) {
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
								return caches.match('index.html');
							}

							return caches.open(staticCacheName).then((cache) => {
								console.log('fetchRequest.url', fetchRequest.url);
								console.log('response', response);
								cache.put(fetchRequest.url, response.clone());

								return response;
							});
						});

				}).catch(function (error) {
				console.error('Error, ', error);
				return caches.match('index.html');
			})
		);
	}
});

/**
 * Iterate over a specific range to add the desired html page url to an array.
 * Since the restaurant html page has a query param "id" in a range between 1 and x,
 * the function will iterate over them and add these url to the result.
 *
 * @param range - the maximum numver of id of the restaurants.
 * @returns {Array} - the result that contains all routed with ids to add for the
 * service worker.
 */
self.addAllRestaurantPages = (range) => {
	console.log('addAllRestaurantPages');
	let dynamicPagesURL = [];
	for (let i = 0; i <= range; i++) {
		i === 0 ? dynamicPagesURL.push('restaurant.html') : dynamicPagesURL.push(`restaurant.html?id=${i}`);
		console.log('i = ', i, `restaurant.html?id=${i}`);
	}
	return dynamicPagesURL;
};

/**
 * Add all images url to the service worker.
 *
 * @param range - the maximum id of images
 * @returns {*[]} - array of images url too add to the service worker
 */
self.addAllRestaurantImages = (range) => {
	console.log('addAllRestaurantImages');
	let fallbackImages = [], responsiveImages = [];
	let responsiveSizes = [320, 480, 640, 800];
	for (let i = 1; i <= range; i++) {
		fallbackImages.push(`img/${i}.jpg`);
		responsiveSizes.forEach((size) => responsiveImages.push(`img_responsive/${i}-${size}.jpg`));
	}
	console.log('all images = ', [...fallbackImages, ...responsiveImages]);
	return [...fallbackImages, ...responsiveImages];
};

/**
 * Cache the images when they are requested.
 *
 * @param request - the outgoing request
 * @returns {Promise<Cache>} - the image response from the cache if it is available,
 * otherwise this will be fetched.
 */
self.handleImagesURL = (request) => {
	return caches
		.open(imagesCacheName)
		.then(cache => {
			return cache.match(request.url)
				.then(response => {
					if (response) {
						return response;
					}

					fetch(request).then(response => {
						cache.put(request.url, response.clone());
						return response;
					});
				});
		});
};
