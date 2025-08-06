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
const newMarketingRequestMessage = require("./newMarketingRequestMessage");
const opsRequestModal = require("./opsRequestModal");
const marketingRequestModal = require("./marketingRequestModal");
const spendRequestModal = require("./spendRequestModal");
const newSpendRequestMessage = require("./newSpendRequestMessage");
const denySpendRequestModal = require("./denySpendRequestModal");

module.exports = {
    buildAppHomeScreen,
    appMaintenance,
    requestModal,
    invoiceRequestModal,
    opsRequestModal,
    marketingRequestModal,
    newRequestMessage,
    newInvoiceRequestMessage,
    newOpsRequestMessage,
    newMarketingRequestMessage,
    spendRequestModal,
    newSpendRequestMessage,
    denySpendRequestModal,
};
