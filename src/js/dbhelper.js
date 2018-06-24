/**
 * Common database helper functions.
 */
class DBHelper {

	/**
	 * Database URL.
	 *
	 */
	static get RESTAURANTS_URL() {
		const port = 1337;
		return `http://localhost:${port}/restaurants`;
	}

	/**
	 * Database URL.
	 *
	 */
	static get REVIEWS_URL() {
		const port = 1337;
		return `http://localhost:${port}/reviews`;
	}

	static openDB() {
		if (!this.checkindexedDB()) {
			const error = 'IndexedDB is not supported in your browser :(';
			console.error(error);
			return Promise.reject(error);
		}

		return idb.open('restaurants-reviews-db', 1, upgradeDb => {
			upgradeDb.createObjectStore('restaurants', {
				keyPath: 'id'
			});

			upgradeDb.createObjectStore('reviews', {
				keyPath: 'id',
			}).createIndex('restaurant_id', 'restaurant_id');

			upgradeDb.createObjectStore('pending-reviews', {
				keyPath: 'id',
				autoIncrement: true
			});

		});
	}

	/**
	 * Adding data to the indexedDB by transaction and store name
	 */
	static addAll(transactionAndStoreName, data) {
		return this.openDB()
			.then(db => {
				const tx = db.transaction(transactionAndStoreName, 'readwrite');
				let store = tx.objectStore(transactionAndStoreName);
				console.log('data added to the db: ', data);
				return Promise.all(
					data.map(data => {
						return store.put(data);
					})
				).catch(err => {
					tx.abort();
					console.error(err);
				});
			})
			.catch(err => console.error(err));
	}

	static add(transactionAndStoreName, data) {
		return this.openDB()
			.then(db => {
				const tx = db.transaction(transactionAndStoreName, 'readwrite');
				let store = tx.objectStore(transactionAndStoreName);
				console.log(`adding ${transactionAndStoreName}`, data);
				return store.put(data)
					.catch(err => {
						tx.abort();
						console.error(err);
					});
			})
			.catch(err => console.error(err));
	}

	/**
	 * Get all data from db by storename
	 *
	 * @returns {PromiseLike<T> | Promise<T>} - the stored data
	 */
	static getAllFromDB(transactionAndStoreName) {
		return this.openDB()
			.then(db => {
				const data = db
					.transaction(transactionAndStoreName, 'readwrite')
					.objectStore(transactionAndStoreName)
					.getAll();

				console.log('getAllRestaurantsFromDB: ', data);
				return data;
			});
	}

	static getAllReviewsFromDBByRestaurantID(transactionAndStoreName, id) {
		return this.openDB()
			.then(db => {
				const data = db
					.transaction(transactionAndStoreName, 'readwrite')
					.objectStore(transactionAndStoreName)
					.index('restaurant_id')
					.getAll(parseInt(id));

				console.log('getAllRestaurantsFromDB: ', data);
				return data;
			});
	}

	static getDataByIDFromDB(transactionAndStoreName, id) {
		return this.openDB()
			.then(db => {
					const tx = db.transaction(transactionAndStoreName, 'readonly');
					const store = tx.objectStore(transactionAndStoreName);
					return store.get(parseInt(id));
				}
			);
	}

	/**
	 * * Fetch all restaurants from the api.
	 * On success, the fetched restaurants will be added to the db
	 *
	 * @returns {Promise<any>} - the fetched restaurants
	 */
	static fetchRestaurantsFromAPI() {
		return fetch(this.RESTAURANTS_URL)
			.then(result => result.json())
			.then(restaurants => {
				this.addAll('restaurants', restaurants);
				return restaurants;
			})
			.catch(err => err);
	}

	static fetchRestaurantsFromAPIByID(id) {
		return fetch(`${this.RESTAURANTS_URL}/${id}`)
			.then(result => result.json())
			.then(restaurant => {
				console.log('getRestaurantByIDFromDB found -> ', restaurant);
				this.add('restaurants', restaurant);
				return restaurant;
			})
			.catch(err => err);
	}

	/**
	 * Fetch all restaurants either from the api or from db.
	 *
	 * @returns {Promise<T | any>} - the fetched restaurants
	 */
	static fetchRestaurants() {

		return this.getAllFromDB('restaurants')
			.then(restaurants => {
				console.log('restaurants size in db : ', restaurants.length);
				if (restaurants && restaurants.length > 0) {
					return restaurants;
				}
				else {
					return this.fetchRestaurantsFromAPI();
				}
			})
			.catch(error => this.fetchRestaurantsFromAPI());
	}

	/**
	 * Fetch all reviews either from the api or from db.
	 *
	 * @returns {Promise<T | any>} - the fetched reviews
	 */
	static fetchRestaurantReviewsByID(id) {

		return this.getAllReviewsFromDBByRestaurantID('reviews', id)
			.then(reviews => {
				console.log('reviews size in db : ', reviews.length);
				if (reviews && reviews.length > 0) {
					return reviews;
				}
				else {
					return this.fetchRestaurantReviewsFromAPI(id);
				}
			})
			.catch(error => this.fetchRestaurantReviewsFromAPI(id));
	}

	/**
	 * Fetch all reviews of a restaurant by restaurant's id
	 */
	static fetchRestaurantReviewsFromAPI(id) {
		return fetch(`${this.REVIEWS_URL}/?restaurant_id=${id}`, {cache: 'reload'})
			.then(result => result.json())
			.then(reviews => {
				console.log('fetchRestaurantReviews -> ', reviews);
				this.addAll('reviews', reviews);
				return reviews;
			})
			.catch(err => err);
	}

	/**
	 * Fetch a reviews of a restaurant by review's id
	 */
	static fetchReviewByIdFromAPI(id) {
		return fetch(`${this.REVIEWS_URL}/${id}`)
			.then(result => result.json())
			.then(review => {
				console.log('fetchReviewById -> ', review);
				// this.addRestaurantByIDToDB(review);
				return review;
			})
			.catch(err => err);
	}

	/**
	 * Fetch a restaurant by its ID from the api.
	 * @param id - the id of the restaurant
	 * @returns {Promise<any>} - the requested restaurant
	 */
	static fetchRestaurantById(id) {

		return this.getDataByIDFromDB('restaurant', id)
			.then(restaurant => {
				if (restaurant) {
					console.log('getRestaurantByIDFromDB found -> ', restaurant);
					return restaurant;
				}
				return this.fetchRestaurantsFromAPIByID(id);
			})
			.catch(error => this.fetchRestaurantsFromAPIByID(id));

	}

	/**
	 * Fetch restaurants by a cuisine type with proper error handling.
	 */
	static fetchRestaurantByCuisine(cuisine) {
		// Fetch all restaurants  with proper error handling
		return DBHelper.fetchRestaurants()
			.then(restaurants => {
				// Filter restaurants to have only given cuisine type
				return restaurants.filter(r => r.cuisine_type === cuisine);
			})
			.catch(err => {
				return err;
			});
	}

	/**
	 * Fetch restaurants by a neighborhood with proper error handling.
	 */
	static fetchRestaurantByNeighborhood(neighborhood) {
		// Fetch all restaurants
		return DBHelper.fetchRestaurants()
			.then(restaurants => {
				// Filter restaurants to have only given neighborhood
				return restaurants.filter(r => r.neighborhood === neighborhood);
			})
			.catch(err => {
				return err;
			});
	}

	/**
	 * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
	 */
	static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
		// Fetch all restaurants

		return DBHelper.fetchRestaurants()
			.then(restaurants => {
				let results = restaurants;
				if (cuisine !== 'all') { // filter by cuisine
					results = results.filter(r => r.cuisine_type === cuisine);
				}
				if (neighborhood !== 'all') { // filter by neighborhood
					results = results.filter(r => r.neighborhood === neighborhood);
				}
				return results;
			})
			.catch(err => {
				return err;
			});
	}

	/**
	 * Fetch all neighborhoods with proper error handling.
	 */
	static fetchNeighborhoods() {
		// Fetch all restaurants
		return DBHelper.fetchRestaurants()
			.then(restaurants => {
				// Get all neighborhoods from all restaurants
				const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
				// Remove duplicates from neighborhoods
				const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) === i);
				return uniqueNeighborhoods;
			})
			.catch(err => {
				return err;
			});
	}

	/**
	 * Fetch all cuisines with proper error handling.
	 */
	static fetchCuisines() {
		// Fetch all restaurants
		return DBHelper.fetchRestaurants()
			.then(restaurants => {
				// Filter restaurants to have only given neighborhood
				// Get all cuisines from all restaurants
				const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
				// Remove duplicates from cuisines
				const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) === i);
				return uniqueCuisines;
			})
			.catch(err => {
				return err;
			});
	}

	/**
	 * Handle favorite restaurant, post to API and save in IDB
	 */
	static updateRestaurantByIsFavorite(restaurant) {
		if (!restaurant) return;

		return fetch(
			`${DBHelper.RESTAURANTS_URL}/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`,
			{
				method: 'PUT'
			}
		)
			.then(response => response.json())
			.then(data => {
				this.add('restaurants', data);
				console.log('update done: ', data);
				return data;
			})
			.catch(e => console.error(`${e}: Could not update.`));
	}

	/**
	 * Restaurant page URL.
	 */
	static urlForRestaurant(restaurant) {
		return (`./restaurant.html?id=${restaurant.id}`);
	}

	/**
	 * Restaurant image URL.
	 */
	static imageUrlForRestaurant(restaurant) {
		return (`/img/${restaurant.photograph}`);
	}

	/**
	 * Restaurant responsive images source set.
	 */
	static imageResponsiveUrlForRestaurant(restaurant) {
		const scale1x = '320';
		const scale1_5x = '480';
		const scale2x = '640';
		const scale3x = '800';

		return (
			`/img_responsive/${restaurant.id}-${scale1x}.jpg ${scale1x}w, 
            /img_responsive/${restaurant.id}-${scale1_5x}.jpg ${scale1_5x}w, 
            /img_responsive/${restaurant.id}-${scale2x}.jpg ${scale2x}w, 
            /img_responsive/${restaurant.id}-${scale3x}.jpg ${scale3x}w`);
	}

	/**
	 * Map marker for a restaurant.
	 */
	static mapMarkerForRestaurant(restaurant, map) {
		const marker = new google.maps.Marker({
				position: restaurant.latlng,
				title: restaurant.name,
				url: DBHelper.urlForRestaurant(restaurant),
				map: map,
				animation: google.maps.Animation.DROP
			}
		);
		return marker;
	}

	/**
	 * Check in indexedDB is supported by the browser
	 * of the end user
	 *
	 * @returns {boolean} - whether indexedDB is supported
	 */
	static checkindexedDB() {
		return 'indexedDB' in window;
	}

	/**
	 * Post new review to API
	 */
	static postReview(review) {

		return fetch(`${DBHelper.REVIEWS_URL}`, {
			method: 'POST',
			body: JSON.stringify(review),
			headers: {
				'Content-Type': 'application/json'
			}
		})
			.then(resp => resp.json())
			.then(data => {
				// store it in the reviews store
				DBHelper.add('reviews', data);
				return data;
			})
			.catch(err => {
				// when connection is down, store the review in db to send it later
				DBHelper.add('pending-reviews', review);
				console.log(`Error: ${err}`);
				return null;
			});
	}

	/**
	 * clear the store by store name
	 */
	static clear(transactionAndStoreName) {
		return DBHelper.openDB().then(db => {
			const tx = db
				.transaction(transactionAndStoreName, 'readwrite')
				.objectStore(transactionAndStoreName)
				.clear();
			return tx.complete;
		});
	}
}
