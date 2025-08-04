/**
 * This is the modal that is used to create a new design request.
 */

const clients = require("../data/clients");
const categories = require("../data/categories");

module.exports = {
    type: "modal",
    callback_id: "",
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
            element: {
                type: "static_select",
                placeholder: {
                    type: "plain_text",
                    text: "Select an item",
                    emoji: true,
                },
                option_groups: categories.spendRequestType,
                action_id: "spendRequestTypeSelect",
            },
            label: {
                type: "plain_text",
                text: "Spend Request Type",
                emoji: true,
            },
        },
        {
            type: "input",
            element: {
                type: "static_select",
                placeholder: {
                    type: "plain_text",
                    text: "Select an item",
                    emoji: true,
                },
                option_groups: categories.spendRequestDepartment,
                action_id: "departmentSelect",
            },
            label: {
                type: "plain_text",
                text: "Department",
                emoji: true,
            },
        },
        {
            type: "input",
            element: {
                type: "static_select",
                placeholder: {
                    type: "plain_text",
                    text: "Select an item",
                    emoji: true,
                },
                option_groups: [
                    {
                        label: {
                            type: "plain_text",
                            text: "Internal",
                            emoji: true,
                        },
                        options: [
                            {
                                text: {
                                    type: "plain_text",
                                    text: "Cegos",
                                    emoji: true,
                                },
                                value: "Cegos",
                            },
                        ],
                    },
                    ...clients.reduce((acc, client) => {
                        const firstLetter = client.charAt(0).toUpperCase();

                        const groupIndex = acc.findIndex(
                            (group) => group.label.text === firstLetter
                        );

                        if (groupIndex === -1) {
                            acc.push({
                                label: {
                                    type: "plain_text",
                                    text: firstLetter,
                                    emoji: true,
                                },
                                options: [],
                            });
                        }

                        acc[acc.length - 1].options.push({
                            text: {
                                type: "plain_text",
                                text: client,
                                emoji: true,
                            },
                            value: client,
                        });

                        return acc;
                    }, []),
                ],
                action_id: "clientSelect",
            },
            label: {
                type: "plain_text",
                text: "Client",
                emoji: true,
            },
        },

        {
            type: "input",
            element: {
                type: "plain_text_input",
                action_id: "projectCode",
                placeholder: {
                    type: "plain_text",
                    text: "Input a project code here",
                },
            },
            label: {
                type: "plain_text",
                text: "Project Code",
                emoji: true,
            },
        },
        {
            type: "input",
            element: {
                type: "plain_text_input",
                multiline: true,
                action_id: "notes",
                max_length: 2000,
                placeholder: {
                    type: "plain_text",
                    text: "Please include additional details",
                },
            },
            label: {
                type: "plain_text",
                text: "Notes",
                emoji: true,
            },
        },
    ],
};
