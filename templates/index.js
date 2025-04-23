/**
 * Creates an object of templates which can be imported into the controller
 */
const appHome = require("./appHomeScreen");
const appMaintenance = require("./appMaintenanceScreen");
const requestModal = require("./requestModal");
const newRequestMessage = require("./newRequestMessage");
const invoiceRequestModal = require("./invoiceRequestModal");
const newInvoiceRequestMessage = require("./newInvoiceRequestMessage");
const opsRequestModal = require("./opsRequestModal");

module.exports = {
  appHome,
  appMaintenance,
  requestModal,
  invoiceRequestModal,
  opsRequestModal,
  newRequestMessage,
  newInvoiceRequestMessage,
};
