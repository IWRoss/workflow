module.exports = {
    type: "modal",
    callback_id: "handleDenySpendRequestModal",
    title: {
        type: "plain_text",
        text: "Deny Spend Request",
        emoji: true,
    },
    submit: {
        type: "plain_text",
        text: "Deny Request",
        emoji: true,
    },
    close: {
        type: "plain_text",
        text: "Cancel",
        emoji: true,
    },
    blocks: [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "Please provide a reason for denying this spend request:",
            },
        },
        {
            type: "input",
            element: {
                type: "plain_text_input",
                multiline: true,
                action_id: "denialReasonInput",
                placeholder: {
                    type: "plain_text",
                    text: "Enter the reason for denial...",
                },
                max_length: 500,
            },
            label: {
                type: "plain_text",
                text: "Reason for Denial",
                emoji: true,
            },
        },
    ],
};
