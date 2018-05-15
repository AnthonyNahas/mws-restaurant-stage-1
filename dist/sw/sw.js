'use strict';

function _toConsumableArray(e) {
	if (Array.isArray(e)) {
		for (var t = 0, n = Array(e.length); t < e.length; t++) n[t] = e[t];
		return n;
	}
	return Array.from(e);
}

var staticCacheName = 'restaurant-static-v1', imagesCacheName = 'restaurant-images-v1';
self.addEventListener('install', function (e) {
	console.log('on install service worker'), e.waitUntil(caches.open(staticCacheName).then(function (e) {
		console.log('open cache: ', staticCacheName), e.addAll(['/', 'css/styles.css', 'js/dbhelper.js', 'js/main.js', 'js/restaurant_info.js', 'index.html'].concat(_toConsumableArray(addAllRestaurantPages(10)))).then(function () {
			caches.open(imagesCacheName).then(function (e) {
				return console.log('open cache: ', imagesCacheName), e.addAll(addAllRestaurantImages(10));
			});
		});
	}).finally(function () {
		return console.log('finished with sw install');
	}));
}), self.addEventListener('activate', function (e) {
	console.log('on activate service worker');
	var t = [staticCacheName];
	e.waitUntil(caches.keys().then(function (e) {
		return Promise.all(e.map(function (e) {
			if (-1 === t.indexOf(e)) return caches.delete(e);
		}));
	}));
}), self.addEventListener('fetch', function (t) {
	new URL(t.request.url).pathname.startsWith('/img') ? t.respondWith(handleImagesURL(t.request)) : t.respondWith(caches.match(t.request).then(function (e) {
		if (e) return e;
		var n = t.request.clone();
		return fetch(n).then(function (t) {
			return 404 === t.status ? caches.match('index.html') : caches.open(staticCacheName).then(function (e) {
				return e.put(n.url, t.clone()), t;
			});
		});
	}).catch(function (e) {
		return console.error('Error, ', e), caches.match('index.html');
	}));
}), addAllRestaurantPages = function (e) {
	for (var t = [], n = 0; n <= e; n++) 0 === n ? t.push('restaurant.html') : t.push('restaurant.html?id=' + n);
	return t;
}, addAllRestaurantImages = function (e) {
	for (var n = [], a = [], r = [320, 480, 640, 800], t = function (t) {
		n.push('img/' + t + '.jpg'), r.forEach(function (e) {
			return a.push('img_responsive/' + t + '-' + e + '.jpg');
		});
	}, c = 1; c <= e; c++) t(c);
	return [].concat(n, a);
}, handleImagesURL = function (n) {
	return caches.open(imagesCacheName).then(function (t) {
		return t.match(n.url).then(function (e) {
			return e || fetch(n).then(function (e) {
				return t.put(n.url, e.clone()), e;
			});
		});
	});
};
