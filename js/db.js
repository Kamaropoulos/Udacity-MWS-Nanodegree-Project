const dbPromise = idb.open('restaurants-store', 1, upgradeDB => {
  upgradeDB.createObjectStore('restaurants');
  upgradeDB.createObjectStore('reviews');
});

const restaurantsDB = {
  get(key) {
    return dbPromise.then(db => {
      return db.transaction('restaurants')
        .objectStore('restaurants').get(key);
    });
  },
  getAll() {
    return dbPromise.then(db => {
      return db.transaction('restaurants')
        .objectStore('restaurants').getAll();
    });
  },
  set(key, val) {
    return dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      tx.objectStore('restaurants').put(val, key);
      return tx.complete;
    });
  },
  delete(key) {
    return dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      tx.objectStore('restaurants').delete(key);
      return tx.complete;
    });
  },
  clear() {
    return dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      tx.objectStore('restaurants').clear();
      return tx.complete;
    });
  },
  keys() {
    return dbPromise.then(db => {
      const tx = db.transaction('restaurants');
      const keys = [];
      const store = tx.objectStore('restaurants');

      // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
      // openKeyCursor isn't supported by Safari, so we fall back
      (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
        if (!cursor) return;
        keys.push(cursor.key);
        cursor.continue();
      });

      return tx.complete.then(() => keys);
    });
  }
};

const reviewsDB = {
  get(key) {
    return dbPromise.then(db => {
      return db.transaction('reviews')
        .objectStore('reviews').get(key);
    });
  },
  getAll() {
    return dbPromise.then(db => {
      return db.transaction('reviews')
        .objectStore('reviews').getAll();
    });
  },
  set(key, val) {
    return dbPromise.then(db => {
      const tx = db.transaction('reviews', 'readwrite');
      tx.objectStore('reviews').put(val, key);
      return tx.complete;
    });
  },
  delete(key) {
    return dbPromise.then(db => {
      const tx = db.transaction('reviews', 'readwrite');
      tx.objectStore('reviews').delete(key);
      return tx.complete;
    });
  },
  clear() {
    return dbPromise.then(db => {
      const tx = db.transaction('reviews', 'readwrite');
      tx.objectStore('reviews').clear();
      return tx.complete;
    });
  },
  keys() {
    return dbPromise.then(db => {
      const tx = db.transaction('reviews');
      const keys = [];
      const store = tx.objectStore('reviews');

      // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
      // openKeyCursor isn't supported by Safari, so we fall back
      (store.iterateKeyCursor || store.iterateCursor).call(store, cursor => {
        if (!cursor) return;
        keys.push(cursor.key);
        cursor.continue();
      });

      return tx.complete.then(() => keys);
    });
  }
};