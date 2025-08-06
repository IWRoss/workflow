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
                    text: "*Spend Type*\n",
                },
                {
                    type: "mrkdwn",
                    text: "*Department*\n",
                },
            ],
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
                    text: "*Project Code*\n",
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
            type: "divider",
        },
        {
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Approve",
                        emoji: true,
                    },
                    value: "",
                    action_id: "approveSpendRequest",
                    style: "primary",
                },
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Decline",
                        emoji: true,
                    },
                    value: "",
                    action_id: "denySpendRequest",
                    style: "danger",
                },
            ],
        },
    ],
};
