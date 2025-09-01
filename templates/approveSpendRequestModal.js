module.exports = {
    type: "modal",
    callback_id: "handleAcceptSpendRequestModal",
    title: {
        type: "plain_text",
        text: "Accept Spend Request",
        emoji: true,
    },
    submit: {
        type: "plain_text",
        text: "Accept Request",
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
                text: "Please provide a reason for accepting this spend request:",
            },
        },
        {
            type: "input",
            element: {
                type: "plain_text_input",
                multiline: true,
                action_id: "acceptanceReasonInput",
                placeholder: {
                    type: "plain_text",
                    text: "Enter a reason for acceptance...",
                },
                max_length: 500,
            },
            label: {
                type: "plain_text",
                text: "Reason for Acceptance",
                emoji: true,
            },
        },
    ],
};
