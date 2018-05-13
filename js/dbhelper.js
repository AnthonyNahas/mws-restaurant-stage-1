/**
 * Common database helper functions.
 */
class DBHelper {

    /**
     * Database URL.
     *
     */
    static get DATABASE_URL() {
        const port = 1337
        return `http://localhost:${port}/restaurants`;
    }

    static openDB() {
        if (!this.checkindexedDB()) {
            const error = "IndexedDB is not supported in your browser :(";
            console.error(error);
            return Promise.reject(error);
        }

        return idb.open('restaurants-reviews-db', 1, upgradeDb => {
            upgradeDb.createObjectStore('restaurants', {
                keyPath: 'id'
            }).createIndex('name', 'id', {unique: true});
        });
    }

    /**
     * Adding restaurants to the indexedDB.
     */
    static addAllRestaurants(restaurants) {
        return this.openDB()
            .then(db => {
                const tx = db.transaction('restaurants', 'readwrite');
                let store = tx.objectStore('restaurants');
                console.log("resto", restaurants);
                return Promise.all(
                    restaurants.map(restaurant => {
                        return store.put(restaurant);
                    })
                ).catch(err => {
                    tx.abort();
                    console.error(err);
                });
            })
            .catch(err => console.error(err));
    }

    /**
     * Fetch all restaurants from the api.
     */
    static fetchRestaurants() {

        return new Promise((resolve, reject) => {
            fetch(this.DATABASE_URL)
                .then(result => {
                    result.json()
                        .then(restaurants => {
                            console.log("all resto", restaurants);
                            this.addAllRestaurants(restaurants);
                            resolve(restaurants);
                        }).catch(error => reject(error))
                }).catch(err => {
                reject(err);
            });
        });
    }

    /**
     * Fetch a restaurant by its ID from the api.
     */
    static fetchRestaurantById(id) {

        return new Promise((resolve, reject) => {
            fetch(`${this.DATABASE_URL}/${id}`)
                .then(result => {
                    resolve(result.json());
                }).catch(err => {
                reject(err);
            });
        });
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
                let results = restaurants
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

}
