/**
 * Axios
 */
const axios = require("axios");

const isValidHttpUrl = (string) => {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
};

/**
 *
 */
const clearRequireCache = () => {
  Object.keys(require.cache).forEach((key) => {
    delete require.cache[key];
  });
};

module.exports = {
  isValidHttpUrl,
  clearRequireCache,
};
