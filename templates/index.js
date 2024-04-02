/**
 * Creates an object of templates which can be imported into the controller
 */
const appHome = require("./appHomeScreen");
const requestModal = require("./requestModal");
const newRequestMessage = require("./newRequestMessage");
const invoiceRequestModal = require("./invoiceRequestModal");
const newInvoiceRequestMessage = require("./newInvoiceRequestMessage");

module.exports = {
  appHome,
  requestModal,
  invoiceRequestModal,
  newRequestMessage,
  newInvoiceRequestMessage,
};
