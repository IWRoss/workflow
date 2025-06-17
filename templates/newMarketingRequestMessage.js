module.exports = {
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "",
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: "*Project Name*\n",
        },
        {
          type: "mrkdwn",
          text: "*Channels*\n",
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Description*\n",
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: "*Review Date*\n",
        },
        {
          type: "mrkdwn",
          text: "*Go-Live Date*\n",
        },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Claim task",
            emoji: true,
          },
          value: "",
          action_id: "claimTask",
          style: "primary",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View on Monday.com",
            emoji: true,
          },
          url: "",
          action_id: "viewOnMonday",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View on Dropbox",
            emoji: true,
          },
          url: "",
          action_id: "viewOnDropbox",
        },
      ],
    },
  ],
};
