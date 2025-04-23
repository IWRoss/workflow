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
        type: "external_select",
        placeholder: {
          type: "plain_text",
          text: "Select an opportunity from the list",
          emoji: true,
        },
        min_query_length: 2,
      },
    },
  ],
};
