let restaurants,
	neighborhoods,
	cuisines,
	map,
	markers = [];


/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
	// self.registerServiceWorker();
	window.initMap = () => {
		let loc = {
			lat: 40.722216,
			lng: -73.987501
		};
		setTimeout(() => {
			console.log('create map');
			self.map = new google.maps.Map(document.getElementById('map'), {
				zoom: 12,
				center: loc,
				scrollwheel: false
			});
			self.addMarkersToMap();
		}, 2000);
		self.updateRestaurants();
	};
	self.fetchNeighborhoods();
	self.fetchCuisines();
});

/**
 * Register service worker to cache requests to all of the
 * site’s assets so that any page that has been visited by a
 * user will be accessible when the user is offline
 */
self.registerServiceWorker = () => {
	if (!navigator.serviceWorker) return;

	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('/sw.js').then(() => {
			console.log('Registration worked!');
		}).catch((err) => {
			console.log('Registration failed!', err);
		});
	}
};
/**
 * Fetch all neighborhoods and set their HTML.
 */
self.fetchNeighborhoods = () => {
	DBHelper.fetchNeighborhoods()
		.then(neighborhoods => {
			self.neighborhoods = neighborhoods;
			self.fillNeighborhoodsHTML();
		})
		.catch(error => console.error(error));
};

/**
 * Set neighborhoods HTML.
 */
self.fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
	const select = document.getElementById('neighborhoods-select');
	neighborhoods.forEach(neighborhood => {
		const option = document.createElement('option');
		option.innerHTML = neighborhood;
		option.value = neighborhood;
		select.append(option);
	});
};

/**
 * Fetch all cuisines and set their HTML.
 */
self.fetchCuisines = () => {
	DBHelper.fetchCuisines()
		.then(cuisines => {
			self.cuisines = cuisines;
			self.fillCuisinesHTML();
		})
		.catch(error => console.error(error));
};

/**
 * Set cuisines HTML.
 */
self.fillCuisinesHTML = (cuisines = self.cuisines) => {
	const select = document.getElementById('cuisines-select');

	cuisines.forEach(cuisine => {
		const option = document.createElement('option');
		option.innerHTML = cuisine;
		option.value = cuisine;
		select.append(option);
	});
};

/**
 * Update page and map for current restaurants.
 */
self.updateRestaurants = () => {
	const cSelect = document.getElementById('cuisines-select');
	const nSelect = document.getElementById('neighborhoods-select');

	const cIndex = cSelect.selectedIndex;
	const nIndex = nSelect.selectedIndex;

	const cuisine = cSelect[cIndex].value;
	const neighborhood = nSelect[nIndex].value;

	DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
		.then(restaurants => {
			self.resetRestaurants(restaurants);
			self.fillRestaurantsHTML();
		})
		.catch(error => console.error(error));
};


/**
 * Clear current restaurants, their HTML and remove their map markers.
 *
 * @param restaurants - the selected restaurant
 */
self.resetRestaurants = (restaurants) => {
	// Remove all restaurants
	self.restaurants = [];
	const ul = document.getElementById('restaurants-list');
	ul.innerHTML = '';

	// Remove all map markers
	markers.forEach(m => m.setMap(null));
	self.markers = [];
	self.restaurants = restaurants;
};


/**
 * Create all restaurants HTML and add them to the webpage.
 *
 * @param restaurants - the selected restaurant
 */
self.fillRestaurantsHTML = (restaurants = self.restaurants) => {
	const ul = document.getElementById('restaurants-list');
	restaurants.forEach(restaurant => {
		ul.append(self.createRestaurantHTML(restaurant));
	});
	if (map) {
		self.addMarkersToMap();
	}
};


/**
 * Create restaurant HTML.
 *
 * @param restaurant - the target restaurant to create the corresponding html element
 * @returns {HTMLLIElement} - the corresponded html element for the targeted restaurant
 */
self.createRestaurantHTML = (restaurant) => {
	const li = document.createElement('li');

	const image = document.createElement('img');
	image.className = 'restaurant-img';
	image.src = DBHelper.imageUrlForRestaurant(restaurant);
	image.srcset = DBHelper.imageResponsiveUrlForRestaurant(restaurant);
	image.sizes = '(max-width: 739px) 80vw, (min-width: 740px) 10vw';
	image.alt = `${restaurant.name} restaurant's photo`;
	li.append(image);

	const name = document.createElement('h2');
	name.innerHTML = restaurant.name;
	li.append(name);

	const neighborhood = document.createElement('p');
	neighborhood.innerHTML = restaurant.neighborhood;
	li.append(neighborhood);

	const address = document.createElement('p');
	address.innerHTML = restaurant.address;
	li.append(address);

	const actionsContainer = document.createElement('div');

	const likeButton = document.createElement('button');

	likeButton.dataset.isFavorite = restaurant.is_favorite === 'true' ? true : false;
	self.setLikeButtonStyles(likeButton);
	likeButton.setAttribute('aria-label', `Like or dislike ${restaurant.name}'s restaurant`);
	self.setLikeButtonListener(restaurant, likeButton);
	actionsContainer.append(likeButton);

	const more = document.createElement('a');
	more.innerHTML = 'View Details';
	more.href = DBHelper.urlForRestaurant(restaurant);
	more.setAttribute('aria-label', `View Details of the ${restaurant.name}'s restaurant`);
	actionsContainer.append(more);

	li.append(actionsContainer);

	return li;
};


/**
 * Add markers for current restaurants to the map.
 *
 * @param restaurants - the selected restaurants
 */
self.addMarkersToMap = (restaurants = self.restaurants) => {
	console.log('add markers');
	restaurants.forEach(restaurant => {
		// Add marker to the map
		const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
		google.maps.event.addListener(marker, 'click', () => {
			window.location.href = marker.url;
		});
		self.markers.push(marker);
	});
};

self.setLikeButtonStyles = (button) => {
	if (button.dataset.isFavorite === 'true') {
		button.innerText = '🧡';
		button.classList.add('isFavorite');
	} else {
		button.innerText = 'Like';
		button.classList.remove('isFavorite');
	}
};

self.setLikeButtonListener = (restaurant, button) => {
	button.addEventListener('click', $event => {
		console.log('before update is favorite of the restaurant', restaurant.is_favorite);

		$event.target.dataset.isFavorite = $event.target.dataset.isFavorite !== 'true';

		restaurant.is_favorite = $event.target.dataset.isFavorite;

		console.log('update is favorite of the restaurant', restaurant.is_favorite);

		// update the button sytles
		self.setLikeButtonStyles($event.target);

		// Update the restaurant server side and in indexedDB
		DBHelper.updateRestaurantByIsFavorite(restaurant);
	});
};
