const {
  getUKBankHolidays,
  getUSPublicHolidays,
} = require("../helpers/helpers");

module.exports = [
  {
    name: "London",
    tz: "Europe/London",
    publicHolidays: getUKBankHolidays(),
  },
  {
    name: "New York",
    tz: "America/New_York",
    publicHolidays: getUSPublicHolidays(),
  },
];
