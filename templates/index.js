/**
 * Creates an object of templates which can be imported into the controller
 */
const buildAppHomeScreen = require("./appHomeScreen");
const appMaintenance = require("./appMaintenanceScreen");
const requestModal = require("./requestModal");
const newRequestMessage = require("./newRequestMessage");
const invoiceRequestModal = require("./invoiceRequestModal");
const newInvoiceRequestMessage = require("./newInvoiceRequestMessage");
const newOpsRequestMessage = require("./newOpsRequestMessage");
const opsRequestModal = require("./opsRequestModal");
const marketingRequestModal = require("./marketingRequestModal");

module.exports = {
  buildAppHomeScreen,
  appMaintenance,
  requestModal,
  invoiceRequestModal,
  opsRequestModal,
  newRequestMessage,
  newInvoiceRequestMessage,
  newOpsRequestMessage,
  marketingRequestModal,
};
