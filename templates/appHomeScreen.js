/**
 * Template appHomeScreen.js
 *
 * This template is used on the App Home screen.
 */

const { isBetaUser } = require("../helpers/helpers");

const blocks = {
    type: "home",
    blocks: [
        {
            type: "header",
            text: {
                type: "plain_text",
                text: "Introducing Workflow, designed to streamline and simplify the ticket submission process for producers.",
                emoji: true,
            },
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "Workflow bot allows producers to submit tickets directly through Slack, providing an easy and convenient way to request Studio and Webdev services. With Workflow, producers can submit tickets by filling out a form, including the client name, producer deadline, client deadline, media type, a link to a Dropbox file containing all the content, and project code. ",
            },
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "Once submitted, the tickets will be automatically added to our Monday board and team members will be able to claim the task with a single click.",
            },
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "*Please note:* Tickets should always be followed up with a conversation with whoever is fulfilling the request.",
            },
        },
        {
            type: "divider",
        },
        {
            type: "header",
            text: {
                type: "plain_text",
                text: "Studio",
                emoji: true,
            },
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "If your project involves *graphic design*, *video*, or *animation*, please submit your ticket using this form.",
            },
            accessory: {
                type: "button",
                text: {
                    type: "plain_text",
                    text: "Create ticket",
                    emoji: true,
                },
                value: "click_me_123",
                action_id: "openStudioRequestForm",
            },
        },
        {
            type: "header",
            text: {
                type: "plain_text",
                text: "Webdev",
                emoji: true,
            },
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "If your project involves *web development*, please submit your ticket using this form.",
            },
            accessory: {
                type: "button",
                text: {
                    type: "plain_text",
                    text: "Create ticket",
                    emoji: true,
                },
                value: "click_me_123",
                action_id: "openCommTechRequestForm",
            },
        },
        {
            type: "header",
            text: {
                type: "plain_text",
                text: "Does your project involve both Studio and Webdev?",
                emoji: true,
            },
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "Please submit your ticket using this form to add it to both Studio and Webdev queues.",
            },
            accessory: {
                type: "button",
                text: {
                    type: "plain_text",
                    text: "Create ticket",
                    emoji: true,
                },
                value: "click_me_123",
                action_id: "openMultipleTeamsRequestForm",
            },
        },
        {
            type: "divider",
        },
        {
            type: "header",
            text: {
                type: "plain_text",
                text: "Invoices",
                emoji: true,
            },
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "If you need to submit an invoice, please use this form.",
            },
            accessory: {
                type: "button",
                text: {
                    type: "plain_text",
                    text: "Create ticket",
                    emoji: true,
                },
                value: "click_me_123",
                action_id: "openInvoiceRequestForm",
            },
        },
    ],
};

// if (isBetaUser()) {
//   blocks.blocks.push({
//     type: "divider",
//   });
//   blocks.blocks.push({
//     type: "header",
//     text: {
//       type: "plain_text",
//       text: "Marketing",
//       emoji: true,
//     },
//   });
//   blocks.blocks.push({
//     type: "section",
//     text: {
//       type: "mrkdwn",
//       text: "If you need to submit a Marketing request, please use this form.",
//     },
//     accessory: {
//       type: "button",
//       text: {
//         type: "plain_text",
//         text: "Create ticket",
//         emoji: true,
//       },
//       value: "click_me_123",
//       action_id: "openMarketingRequestForm",
//     },
//   });
// }

const betaBlocks = {
    blocks: [
        {
            type: "divider",
        },
        {
            type: "header",
            text: {
                type: "plain_text",
                text: "Marketing",
                emoji: true,
            },
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "If you need to submit a Marketing request, please use this form.",
            },
            accessory: {
                type: "button",
                text: {
                    type: "plain_text",
                    text: "Create ticket",
                    emoji: true,
                },
                value: "click_me_123",
                action_id: "openMarketingRequestForm",
            },
        },
    ],
};

const buildAppHomeScreen = (user) => {
    const appHomeScreen = JSON.parse(JSON.stringify(blocks));

    const isBeta = isBetaUser(user.id);

    if (isBeta) {
        appHomeScreen.blocks.push(...betaBlocks.blocks);
    }

    return appHomeScreen;
};

module.exports = buildAppHomeScreen;
