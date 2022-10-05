/**
 * Template appHomeScreen.js
 *
 * This template is used on the App Home screen.
 */

module.exports = {
  type: "home",
  blocks: [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "Studio Requests",
        emoji: true,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Open request form",
            emoji: true,
          },
          value: "click_me_123",
          action_id: "openDesignRequestForm",
        },
      ],
    },
  ],
};
