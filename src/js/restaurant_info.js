let restaurant;
let map;

/**
 * Register the service worker as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
	self.registerServiceWorker();

	// Initialize Google map, called from HTML.
	window.initMap = () => {
		self.registerServiceWorker();
		self.fetchRestaurantFromURL()
			.then(restaurant => {
				console.log('window.initMap with resto: ', restaurant);
				setTimeout(() => {
					self.map = new google.maps.Map(document.getElementById('map'), {
						zoom: 16,
						center: restaurant.latlng,
						scrollwheel: false
					});
				}, 2000);
				self.fillBreadcrumb();
				DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
			})
			.catch(error => console.error(error));  // Got an error!
	};

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
 * Get current restaurant from page URL.
 */
self.fetchRestaurantFromURL = () => {

	return new Promise((resolve, reject) => {

		if (self.restaurant) { // restaurant already fetched!
			console.log('restaurant already fetched: ', self.restaurant);
			resolve(self.restaurant);
		}

		const id = self.getParameterByName('id');
		if (!id) { // no id found in URL
			const error = 'No restaurant id in URL';
			reject(error);
		}
		else {
			DBHelper.fetchRestaurantById(id)
				.then(restaurant => {
					self.restaurant = restaurant;
					self.fillRestaurantHTML();
					resolve(restaurant);
				})
				.catch(error => {
					self.restaurant = undefined;
					reject(error);
				});
		}
	});
};

/**
 * Create restaurant HTML and add it to the webpage
 */
self.fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.innerHTML = restaurant.name;

	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;

	const image = document.getElementById('restaurant-img');
	image.className = 'restaurant-img';
	image.src = DBHelper.imageUrlForRestaurant(restaurant);
	image.srcset = DBHelper.imageResponsiveUrlForRestaurant(restaurant);
	image.sizes = '(max-width: 400px) 40vw, (min-width: 401px) 60vw, (min-width: 599px) 80vw';
	image.alt = restaurant.name;

	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;

	// fill operating hours
	if (restaurant.operating_hours) {
		self.fillRestaurantHoursHTML();
	}
	// fill reviews
	self.fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
self.fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	for (let key in operatingHours) {
		const row = document.createElement('tr');

		const day = document.createElement('td');
		day.innerHTML = key;
		row.appendChild(day);

		const time = document.createElement('td');
		time.innerHTML = operatingHours[key];
		row.appendChild(time);

		hours.appendChild(row);
	}
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
self.fillReviewsHTML = (reviews = self.restaurant.reviews) => {
	const container = document.getElementById('reviews-container');
	const title = document.createElement('h4');
	title.innerHTML = 'Reviews';
	container.appendChild(title);

	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}
	const ul = document.getElementById('reviews-list');
	reviews.forEach(review => {
		ul.appendChild(self.createReviewHTML(review));
	});
	container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
self.createReviewHTML = (review) => {
	const li = document.createElement('li');
	const name = document.createElement('p');
	name.innerHTML = review.name;
	li.appendChild(name);

	const date = document.createElement('p');
	date.innerHTML = review.date;
	li.appendChild(date);

	const rating = document.createElement('p');
	rating.innerHTML = `Rating: ${review.rating}`;
	li.appendChild(rating);

	const comments = document.createElement('p');
	comments.innerHTML = review.comments;
	li.appendChild(comments);

	return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
self.fillBreadcrumb = (restaurant = self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	const li = document.createElement('li');
	li.innerHTML = restaurant.name;
	breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
self.getParameterByName = (name, url) => {
	if (!url)
		url = window.location.href;
	name = name.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
