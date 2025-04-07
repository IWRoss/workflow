/**
 * Template appMaintenanceScreen.js
 *
 * This template is used on the App Home screen when in maintenance mode.
 */

module.exports = {
  type: "home",
  blocks: [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🚧 Maintenance Mode",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Workflow is currently undergoing maintenance. Back shortly!",
      },
    },
  ],
};
