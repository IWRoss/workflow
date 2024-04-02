/**
 * This is the modal that is used to create a new design request.
 */

const clients = require("../data/clients");

module.exports = {
  type: "modal",
  callback_id: "handleInvoiceRequestResponse",
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
        type: "static_select",
        placeholder: {
          type: "plain_text",
          text: "Select a client from the list",
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
        action_id: "projectClientInput",
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
        type: "plain_text_input",
        action_id: "projectNameInput",
        placeholder: {
          type: "plain_text",
          text: "Enter the Project Name (ensuring it matches Copper exactly)",
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
          text: "Enter a description for the invoice (e.g. # design/delivery days)",
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
        type: "plain_text_input",
        action_id: "projectCodeInput",
        placeholder: {
          type: "plain_text",
          text: "Enter the Project Code (e.g. INV001)",
          emoji: true,
        },
      },
      label: {
        type: "plain_text",
        text: "Project Code",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "plain_text_input",
        action_id: "projectAmountInput",
        placeholder: {
          type: "plain_text",
          text: "Enter the invoice amount (specifying currency)",
          emoji: true,
        },
      },
      label: {
        type: "plain_text",
        text: "Total amount",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "plain_text_input",
        action_id: "projectContactNameInput",
        placeholder: {
          type: "plain_text",
          text: "Enter the name of the contact",
          emoji: true,
        },
      },
      label: {
        type: "plain_text",
        text: "Contact name",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "email_text_input",
        action_id: "projectContactEmailInput",
        placeholder: {
          type: "plain_text",
          text: "Enter an email address for the contact",
          emoji: true,
        },
      },
      label: {
        type: "plain_text",
        text: "Contact email address",
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
        action_id: "projectDateInput",
      },
      label: {
        type: "plain_text",
        text: "Date to send invoice",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "plain_text_input",
        multiline: true,
        action_id: "projectNotesInput",
        placeholder: {
          type: "plain_text",
          text: "Add any additional notes here (optional)",
          emoji: true,
        },
      },
      label: {
        type: "plain_text",
        text: "Notes",
        emoji: true,
      },
    },
  ],
};
