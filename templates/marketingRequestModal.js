/**
 * This is the modal that is used to create a new design request.
 */

const clients = require("../data/clients");

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
    // Channel select field: YouTube, Events, Content, Email, Instagram, Internal, LinkedIn, Print, Website
    {
      type: "input",
      element: {
        type: "multi_static_select",
        placeholder: {
          type: "plain_text",
          text: "Select channels",
          emoji: true,
        },
        action_id: "channelSelect",
        options: [
          { text: { type: "plain_text", text: "YouTube" }, value: "youtube" },
          { text: { type: "plain_text", text: "Events" }, value: "events" },
          { text: { type: "plain_text", text: "Content" }, value: "content" },
          { text: { type: "plain_text", text: "Email" }, value: "email" },
          {
            text: { type: "plain_text", text: "Instagram" },
            value: "instagram",
          },
          { text: { type: "plain_text", text: "Internal" }, value: "internal" },
          { text: { type: "plain_text", text: "LinkedIn" }, value: "linkedin" },
          { text: { type: "plain_text", text: "Print" }, value: "print" },
          { text: { type: "plain_text", text: "Website" }, value: "website" },
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
