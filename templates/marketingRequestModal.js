/**
 * This is the modal that is used to create a new design request.
 */

const clients = require("../data/clients");
const { type } = require("./appMaintenanceScreen");

module.exports = {
  type: "modal",
  callback_id: "handleMarketingRequestResponse",
  title: {
    type: "plain_text",
    text: "Post a request",
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
        type: "plain_text_input",
        action_id: "projectNameInput",
        placeholder: {
          type: "plain_text",
          text: "Enter a name for the project",
          emoji: true,
        },
      },
      label: {
        type: "plain_text",
        text: "Project Name",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "plain_text_input",
        multiline: true,
        action_id: "projectDescriptionInput",
        placeholder: {
          type: "plain_text",
          text: "Enter a description for the project",
          emoji: true,
        },
      },
      label: {
        type: "plain_text",
        text: "Description",
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
        action_id: "reviewDateInput",
      },
      label: {
        type: "plain_text",
        text: "Review date",
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
        action_id: "goLiveDateInput",
      },
      label: {
        type: "plain_text",
        text: "Go-Live date",
        emoji: true,
      },
    },
    // Dropbox link
    {
      type: "input",
      element: {
        type: "plain_text_input",
        action_id: "dropboxLinkInput",
        placeholder: {
          type: "plain_text",
          text: "Enter a link to the Dropbox folder for this project",
          emoji: true,
        },
      },
      label: {
        type: "plain_text",
        text: "Dropbox link",
        emoji: true,
      },
    },
    // Campaign selection
    {
      type: "input",
      element: {
        type: "static_select",
        placeholder: {
          type: "plain_text",
          text: "Select a campaign",
          emoji: true,
        },
        action_id: "campaignSelect",
        options: [],
      },
    },
    {
      type: "input",
      element: {
        type: "static_select",
        placeholder: {
          type: "plain_text",
          text: "Select channels",
          emoji: true,
        },
        action_id: "channelSelect",
        options: [
          { text: { type: "plain_text", text: "YouTube" }, value: "YouTube" },
          { text: { type: "plain_text", text: "Events" }, value: "Events" },
          { text: { type: "plain_text", text: "Content" }, value: "Content" },
          { text: { type: "plain_text", text: "Email" }, value: "Email" },
          {
            text: { type: "plain_text", text: "Instagram" },
            value: "Instagram",
          },
          { text: { type: "plain_text", text: "Internal" }, value: "Internal" },
          { text: { type: "plain_text", text: "LinkedIn" }, value: "LinkedIn" },
          { text: { type: "plain_text", text: "Print" }, value: "Print" },
          { text: { type: "plain_text", text: "Website" }, value: "Website" },
        ],
      },
      label: {
        type: "plain_text",
        text: "Channels",
        emoji: true,
      },
    },
    {
      type: "divider",
    },
  ],
};
