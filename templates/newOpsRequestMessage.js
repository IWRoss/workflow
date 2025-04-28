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
          text: "*Opportunity*\n",
        },
        {
          type: "mrkdwn",
          text: "*Project Code*\n",
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
            text: "View on Copper",
            emoji: true,
          },
          url: "",
          action_id: "viewOnCopper",
        },
      ],
    },
  ],
};
