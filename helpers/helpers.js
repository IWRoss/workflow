/**
 * Axios
 */
const axios = require("axios");

/**
 * Get UK public holidays
 */
const getUKBankHolidays = async () => {
  const bankHolidays = await axios.get("https://www.gov.uk/bank-holidays.json");

  return bankHolidays.data["england-and-wales"].events.map(
    (event) => event.date
  );
};

/**
 * Get US public holidays
 */
const getUSPublicHolidays = async () => {
  const currentYear = new Date().getFullYear();

  const publicHolidays = await axios.get(
    `https://date.nager.at/api/v2/publicholidays/${currentYear}/US`
  );

  return publicHolidays.data.map((event) => event.date);
};

module.exports = {
  getDatesBetween,
  getUKBankHolidays,
  getUSPublicHolidays,
};
