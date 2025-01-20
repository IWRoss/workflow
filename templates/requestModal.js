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
        // options: [
        //   ...clients.map((client) => {
        //     return {
        //       text: {
        //         type: "plain_text",
        //         text: client,
        //         emoji: true,
        //       },
        //       value: client,
        //     };
        //   }),
        // ],
        option_groups: [
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
        type: "datepicker",
        initial_date: new Date().toISOString().split("T")[0],
        placeholder: {
          type: "plain_text",
          text: "Select a date",
          emoji: true,
        },
        action_id: "producerDeadline",
      },
      label: {
        type: "plain_text",
        text: "Producer deadline",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "datepicker",
        initial_date: new Date().toISOString().split("T")[0],
        placeholder: {
          type: "plain_text",
          text: "Select a date",
          emoji: true,
        },
        action_id: "clientDeadline",
      },
      label: {
        type: "plain_text",
        text: "Client deadline",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "multi_static_select",
        placeholder: {
          type: "plain_text",
          text: "Select options",
          emoji: true,
        },
        options: [],
        action_id: "mediaSelect",
      },
      label: {
        type: "plain_text",
        text: "Media (you can select multiple types)",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "plain_text_input",
        action_id: "dropboxLink",
        placeholder: {
          type: "plain_text",
          text: "Paste a Dropbox link here. Must be a valid URL",
        },
      },
      label: {
        type: "plain_text",
        text: "Dropbox link",
        emoji: true,
      },
    },
    {
      type: "input",
      element: {
        type: "plain_text_input",
        multiline: true,
        action_id: "notes",
        placeholder: {
          type: "plain_text",
          text: "Please include additional details, such as project name, branding, scope, etc.",
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
