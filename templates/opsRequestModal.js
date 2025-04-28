module.exports = {
  type: "modal",
  callback_id: "handleOpsRequestResponse",
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
      label: {
        type: "plain_text",
        text: "Select an opportunity from the list.",
        emoji: true,
      },
      element: {
        type: "external_select",
        action_id: "getOpportunityOptions",
        placeholder: {
          type: "plain_text",
          text: "Type to search",
          emoji: true,
        },
        min_query_length: 2,
      },
    },
  ],
};
