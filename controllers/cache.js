const cache = new Map();

/**
 * Set a value in the cache
 * @param {String} key - The key to store the value under
 * @param {any} value - The value to store
 * @param {Number} ttl - Time to live in milliseconds
 */
const setCache = (key, value, ttl = 24 * 60 * 60 * 1000) => {
  const expiry = Date.now() + ttl;

  cache.set(key, { value, expiry });

  console.log(`Cache size: ${cache.size} entries`);
  console.log(`Cache set for key: ${key}, expires at: ${new Date(expiry)}`);
};

/**
 * Get a value from the cache
 * @param {String} key - The key to retrieve the value for
 * @returns {any} - The cached value or null if not found or expired
 */
const getCache = (key) => {
  const cached = cache.get(key);

  console.log(`Cache size: ${cache.size} entries`);

  if (!cached) return null;

  if (Date.now() > cached.expiry) {
    cache.delete(key);

    return null;
  }

  return cached.value;
};

/**
 * Delete a value from the cache
 * @param {String} key - The key to delete the value for
 */
const deleteCache = (key) => {
  cache.delete(key);
};

/**
 * Clear the entire cache
 */
const clearCache = () => {
  cache.clear();
};

module.exports = {
  setCache,
  getCache,
  deleteCache,
  clearCache,
};
