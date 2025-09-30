/**
 * This is the modal that is used to create a opportunity to improve modal
 */

const categories = require("../data/categories");

module.exports = {
    type: "modal",
    callback_id: "",
    title: {
        type: "plain_text",
        text: "Opportunity to Improve",
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
                type: "static_select",
                placeholder: {
                    type: "plain_text",
                    text: "Select an area",
                    emoji: true,
                },
                option_groups: categories.ISOAreas,
                action_id: "areaSelect",
            },
            label: {
                type: "plain_text",
                text: "Area",
                emoji: true,
            },
        },
        {
            type: "input",
            element: {
                type: "plain_text_input",
                multiline: true,
                action_id: "complaintText",
                max_length: 2000,
                placeholder: {
                    type: "plain_text",
                    text: "Please describe the complaint",
                },
            },
            label: {
                type: "plain_text",
                text: "Complaint Details",
                emoji: true,
            },
        },
        {
            type: "input",
            element: {
                type: "static_select",
                placeholder: {
                    type: "plain_text",
                    text: "Select priority",
                    emoji: true,
                },
                option_groups: categories.ISOPriority,
                action_id: "prioritySelect",
            },
            label: {
                type: "plain_text",
                text: "Priority",
                emoji: true,
            },
        },
    ],
};