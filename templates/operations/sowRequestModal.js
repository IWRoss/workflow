const sowRequestModal = {
  type: "modal",
  callback_id: "sow_submit",
  title: {
    type: "plain_text",
    text: "New SOW Request",
  },
  submit: {
    type: "plain_text",
    text: "Submit",
  },
  close: {
    type: "plain_text",
    text: "Cancel",
  },
  blocks: [
    {
      type: "input",
      block_id: "project_code_block",
      label: {
        type: "plain_text",
        text: "Project Code",
      },
      element: {
        type: "external_select",
        action_id: "project_code_select",
        min_query_length: 4,
        placeholder: {
          type: "plain_text",
          text: "Type at least 4 characters...",
        },
      },
    },
    
    {
      type: "input",
      block_id: "timeline_start_block",
      label: {
        type: "plain_text",
        text: "Timeline - Start date",
      },
      element: {
        type: "datepicker",
        action_id: "timeline_start",
      },
    },
    {
      type: "input",
      block_id: "timeline_end_block",
      label: {
        type: "plain_text",
        text: "Timeline - End date",
      },
      element: {
        type: "datepicker",
        action_id: "timeline_end",
      },
    },
    {
      type: "input",
      block_id: "work_block",
      label: {
        type: "plain_text",
        text: "Work that needs to be done on SOW",
      },
      element: {
        type: "plain_text_input",
        action_id: "work_description",
        placeholder: {
          type: "plain_text",
          text: "You can write or paste the work description here.",
        },
        multiline: true,
      },
    },
    {
      type: "input",
      block_id: "team_block",
      label: {
        type: "plain_text",
        text: "Team members (comma separated)",
      },
      element: {
        type: "plain_text_input",
        action_id: "team_members",
        placeholder: {
          type: "plain_text",
          text: "Jane Doe, John Smith",
        },
      },
    },
  ],
};

module.exports = sowRequestModal;