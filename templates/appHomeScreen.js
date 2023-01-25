/**
 * Template appHomeScreen.js
 *
 * This template is used on the App Home screen.
 */

module.exports = {
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
        text: "Workflow bot allows producers to submit tickets directly through Slack, providing an easy and convenient way to request Studio and CommTech services. With Workflow, producers can submit tickets by filling out a form, including the client name, producer deadline, client deadline, media type, and a link to a Dropbox file containing all the content. ",
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
        text: "If your project involves *graphic design* or *animation*, please submit your ticket using this form.",
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
        text: "CommTech",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "If your project involves *video*, *web development*, or *internal marketing*, please submit your ticket using this form.",
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
        text: "Does your project involve both Studio and CommTech?",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Please submit your ticket using this form to add it to both Studio and CommTech queues.",
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
  ],
};
