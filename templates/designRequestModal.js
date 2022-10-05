/**
 * Template requestLeaveModal.js
 *
 * This template is used when a user clicks the button to submit a new leave
 * request, opening a modal window. Some of these blocks are dynamically
 * populated with data from the user's form submission.
 */

const clients = require("../data/clients");
const categories = require("../data/categories");

module.exports = {
  type: "modal",
  callback_id: "handleDesignRequestResponse",
  title: {
    type: "plain_text",
    text: "Post a studio request",
    emoji: true,
  },
  submit: {
    type: "plain_text",
    text: "Submit",
    emoji: true,
  },
  close: {
    type: "plain_text",
    text: "Cancel",
    emoji: true,
  },
  blocks: [
    {
      type: "input",
      element: {
        type: "static_select",
        placeholder: {
          type: "plain_text",
          text: "Select an item",
          emoji: true,
        },
        options: [
          ...clients.map((client) => {
            return {
              text: {
                type: "plain_text",
                text: client,
                emoji: true,
              },
              value: client,
            };
          }),
        ],
        action_id: "clientSelect",
      },
      label: {
        type: "plain_text",
        text: "Client",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "datepicker",
        initial_date: new Date().toISOString().split("T")[0],
        placeholder: {
          type: "plain_text",
          text: "Select a date",
          emoji: true,
        },
        action_id: "producerDeadline",
      },
      label: {
        type: "plain_text",
        text: "Producer deadline",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "datepicker",
        initial_date: new Date().toISOString().split("T")[0],
        placeholder: {
          type: "plain_text",
          text: "Select a date",
          emoji: true,
        },
        action_id: "clientDeadline",
      },
      label: {
        type: "plain_text",
        text: "Client deadline",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "multi_static_select",
        placeholder: {
          type: "plain_text",
          text: "Select options",
          emoji: true,
        },
        options: [
          ...categories.map((category) => {
            return {
              text: {
                type: "plain_text",
                text: category,
                emoji: true,
              },
              value: category,
            };
          }),
        ],
        action_id: "mediaSelect",
      },
      label: {
        type: "plain_text",
        text: "Media (you can select multiple types)",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "plain_text_input",
        action_id: "dropboxLink",
        placeholder: "Paste a Dropbox link here. Must be a valid URL",
      },
      label: {
        type: "plain_text",
        text: "Dropbox link",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "plain_text_input",
        multiline: true,
        action_id: "notes",
        placeholder:
          "Please include additional details, such as project name, branding, scope, etc.",
      },
      label: {
        type: "plain_text",
        text: "Notes",
        emoji: true,
      },
    },
  ],
};