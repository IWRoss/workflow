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
const approveSpendRequestModal = require("./approveSpendRequestModal");
const customerComplaintModal = require("./customerComplaintModal");
const opportunityToImproveModal = require("./opportunityToImproveModal");
const newCustomerComplaintMessage = require("./newCustomerComplaintMessage");
const newOpportunityToImproveMessage = require("./newOpportunityToImprove");


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
    approveSpendRequestModal,
    customerComplaintModal,
    opportunityToImproveModal,
    newCustomerComplaintMessage,
    newOpportunityToImproveMessage,
};
