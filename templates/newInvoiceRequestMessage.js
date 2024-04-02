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
          text: "*Client*\n",
        },
        {
          type: "mrkdwn",
          text: "*Project Name*\n",
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
          text: "*Project Code*\n",
        },
        {
          type: "mrkdwn",
          text: "*Total amount*\n",
        },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: "*Contact name*\n",
        },
        {
          type: "mrkdwn",
          text: "*Contact email address*\n",
        },
        {
          type: "mrkdwn",
          text: "*Date to send invoice*\n",
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Notes*\n",
      },
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
      ],
    },
  ],
};
