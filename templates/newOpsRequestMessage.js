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
            text: {
                type: "mrkdwn",
                text: "",
            },
        },
        {
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "✓ Mark cost sheets as uploaded",
                        emoji: true,
                    },
                    value: "",
                    action_id: "markAsDone",
                    style: "primary",
                },
            ],
        },
        {
            type: "divider",
        },
    ],
};
