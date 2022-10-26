/**
 * Creates an object of templates which can be imported into the controller
 */
const appHome = require("./appHomeScreen");
const designRequestModal = require("./designRequestModal");
const newRequestMessage = require("./newRequestMessage");

module.exports = {
  appHome: { ...appHome },
  designRequestModal: { ...designRequestModal },
  newRequestMessage: { ...newRequestMessage },
};
