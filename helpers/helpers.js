/**
 * Axios
 */
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

/**
 * Camel case to capital case
 */
const camelCaseToCapitalCase = (str) => {
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (str) => str.toUpperCase());
};

module.exports = {
  isValidHttpUrl,
  clearRequireCache,
  camelCaseToCapitalCase,
};
