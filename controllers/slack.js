/**
 * Slack controller
 *
 * This controller handles all of our interactions with Slack
 */
const { WebClient } = require("@slack/web-api");

const _ = require("lodash");

const {
  addTaskToBoard,
  getMondayUserByEmail,
  updateAssignedUser,
} = require("./monday");

const { isValidHttpUrl } = require("../helpers/helpers.js");

const templates = require("../templates");

/**
 * Initialise Slack
 */
const slack = new WebClient(process.env.SLACK_TOKEN);

/**
 * Get list of Slack users
 */
const getMembers = async () => {
  const users = await slack.users.list();

  return users.members.filter(
    (m) => !m.is_bot && !m.deleted && !m.is_restricted && !m.is_ultra_restricted
  );
};

/**
 * Filter members
 */
const filterMembers = (members) => {
  // If in development mode, only send to the defined user
  if (process.env.NODE_ENV === "development") {
    return members.filter((member) => member.id === process.env.TEST_USER);
  }

  // If in beta release mode, only send to the defined users
  if (parseInt(process.env.BETA_RELEASE)) {
    return members.filter((member) =>
      process.env.BETA_USERS.split(",").includes(member.id)
    );
  }

  // Otherwise send to everyone
  return members;
};

/**
 *
 */
const addWorkflowInterfaceToSlack = async () => {
  // Get templates
  const appHomeTemplate = { ...templates.appHome };

  // Get list of members
  const members = await getMembers();

  // Filter members
  const filteredMembers = filterMembers(members);

  // Send message to each member
  filteredMembers.forEach(async (member) => {
    // Send message
    await slack.views.publish({
      user_id: member.id,
      view: appHomeTemplate,
    });
  });
};

/**
 * Open Studio Request Form
 */
const openRequestForm = async (payload, callbackName) => {
  // Get templates
  const requestModal = _.cloneDeep(templates.requestModal);

  requestModal.callback_id =
    callbackName || "handleMultipleTeamsRequestResponse";

  const categories = require("../data/categories");

  /**
   * Define a const theCategories containing either the categories corresponding to the callbackName,
   * or, if that does not exist, flatten the categories object and return all values, removing duplicates
   */

  const theCategories = categories[callbackName] || [
    ...new Set(_.flatten(Object.values(categories))),
  ];

  requestModal.blocks[3].element.options = theCategories.map((category) => {
    return {
      text: {
        type: "plain_text",
        text: category,
        emoji: true,
      },
      value: category,
    };
  });

  try {
    // Send leave request form to Slack
    const result = await slack.views.open({
      trigger_id: payload.trigger_id,
      view: requestModal,
    });
  } catch (error) {
    console.log(error);
  }
};

const openStudioRequestForm = async (payload) =>
  openRequestForm(payload, "handleStudioRequestResponse");

const openCommTechRequestForm = async (payload) =>
  openRequestForm(payload, "handleCommTechRequestResponse");

const openMultipleTeamsRequestForm = async (payload) =>
  openRequestForm(payload, "handleMultipleTeamsRequestResponse");

const openInvoiceRequestForm = async (payload) => {
  const invoiceRequestModal = _.cloneDeep(templates.invoiceRequestModal);

  try {
    // Send leave request form to Slack
    const result = await slack.views.open({
      trigger_id: payload.trigger_id,
      view: invoiceRequestModal,
    });
  } catch (error) {
    console.log(error);
  }
};

/**
 * Find field
 */
const findField = (fields, field) => {
  return fields.find((f) => f.hasOwnProperty(field))[field];
};

/**
 * Handle Request Response
 */
const handleRequestResponse = async (payload, locations) => {
  const fields = Object.values(payload.view.state.values);

  // Get the user
  const user = await getUserById(payload.user.id);

  // Get the Monday user
  const mondayUser = await getMondayUserByEmail(user.profile.email);

  const newTask = {
    user: mondayUser.id,
    client: findField(fields, "clientSelect").selected_option.value,
    producerDeadline: findField(fields, "producerDeadline").selected_date,
    clientDeadline: findField(fields, "clientDeadline").selected_date,
    media: findField(fields, "mediaSelect")
      .selected_options.map((m) => m.value)
      .join(", "),
    dropboxLink: findField(fields, "dropboxLink").value,
    notes: findField(fields, "notes").value,
  };

  // Add task to boards
  const results = locations.map(async ({ boardId, slackChannel }) => {
    const result = await addTaskToBoard(newTask, boardId);

    let newRequestMessageTemplate = _.cloneDeep(templates.newRequestMessage);

    newRequestMessageTemplate.blocks[0].text.text = `*<@${payload.user.id}>* submitted a new request:`;
    newRequestMessageTemplate.blocks[1].fields[0].text += newTask.client;
    newRequestMessageTemplate.blocks[1].fields[1].text += newTask.media;
    newRequestMessageTemplate.blocks[2].fields[0].text +=
      newTask.producerDeadline;
    newRequestMessageTemplate.blocks[2].fields[1].text +=
      newTask.clientDeadline;
    newRequestMessageTemplate.blocks[3].text.text += newTask.notes;
    newRequestMessageTemplate.blocks[4].elements[0].value = JSON.stringify({
      boardId,
      itemId: result.data.create_item.id,
    });
    newRequestMessageTemplate.blocks[4].elements[1].url = `https://iwcrew.monday.com/boards/${boardId}/pulses/${result.data.create_item.id}`;

    if (isValidHttpUrl(newTask.dropboxLink)) {
      newRequestMessageTemplate.blocks[4].elements[2].url = newTask.dropboxLink;
    } else {
      newRequestMessageTemplate.blocks[4].elements.splice(2, 1);
    }

    try {
      // Send message to users
      const message = await slack.chat.postMessage({
        channel: slackChannel,
        ...newRequestMessageTemplate,
      });
    } catch (error) {
      console.log(error);
    }

    return result;
  });

  return results;
};

const handleStudioRequestResponse = async (payload) =>
  handleRequestResponse(payload, [
    {
      boardId: process.env.STUDIO_MONDAY_BOARD,
      slackChannel: process.env.STUDIO_SLACK_CHANNEL,
    },
  ]);

const handleCommTechRequestResponse = async (payload) =>
  handleRequestResponse(payload, [
    {
      boardId: process.env.COMMTECH_MONDAY_BOARD,
      slackChannel: process.env.COMMTECH_SLACK_CHANNEL,
    },
  ]);

const handleMultipleTeamsRequestResponse = async (payload) =>
  handleRequestResponse(payload, [
    {
      boardId: process.env.STUDIO_MONDAY_BOARD,
      slackChannel: process.env.STUDIO_SLACK_CHANNEL,
    },
    {
      boardId: process.env.COMMTECH_MONDAY_BOARD,
      slackChannel: process.env.COMMTECH_SLACK_CHANNEL,
    },
  ]);

const handleInvoiceRequestResponse = async (payload) => {
  const fields = Object.values(payload.view.state.values);

  let newInvoiceRequestMessageTemplate = _.cloneDeep(
    templates.newInvoiceRequestMessage
  );

  newInvoiceRequestMessageTemplate.blocks[0].text.text = `*<@${payload.user.id}>* submitted a new request:`;

  newRequestMessageTemplate.blocks[1].fields[0].text += findField(
    fields,
    "projectClientInput"
  ).value;

  newRequestMessageTemplate.blocks[1].fields[1].text += findField(
    fields,
    "projectNameInput"
  ).value;

  newRequestMessageTemplate.blocks[2].text.text += findField(
    fields,
    "projectDescriptionInput"
  ).value;

  newRequestMessageTemplate.blocks[3].fields[0].text += findField(
    fields,
    "projectCodeInput"
  ).value;

  newRequestMessageTemplate.blocks[3].fields[1].text += findField(
    fields,
    "projectAmountInput"
  ).value;

  newRequestMessageTemplate.blocks[4].fields[0].text += findField(
    fields,
    "projectContactNameInput"
  ).value;

  newRequestMessageTemplate.blocks[4].fields[1].text += findField(
    fields,
    "projectContactEmailInput"
  ).value;

  newRequestMessageTemplate.blocks[4].fields[2].text += findField(
    fields,
    "projectDateInput"
  ).value;

  newRequestMessageTemplate.blocks[5].text.text += findField(
    fields,
    "projectNotesInput"
  ).value;

  try {
    // Send message to users
    const message = await slack.chat.postMessage({
      channel: process.env.INVOICE_SLACK_CHANNEL,
      ...newInvoiceRequestMessageTemplate,
    });
  } catch (error) {
    console.log(error);
  }
};

/**
 * Claim task as user
 */
const claimTask = async (payload) => {
  // Get the user
  const user = await getUserById(payload.user.id);

  // Get the Monday user
  const mondayUser = await getMondayUserByEmail(user.profile.email);

  const taskAddress = payload.message.blocks[4].elements[1].url;

  const { boardId, itemId } = JSON.parse(payload.actions[0].value);

  // Update the task
  await updateAssignedUser(mondayUser.id, itemId, boardId);

  // Remove the claim button
  payload.message.blocks[4].elements.splice(0, 1);

  // Add a block showing the user who claimed the task
  payload.message.blocks.splice(4, 0, {
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*<@${payload.user.id}>* claimed this task`,
    },
  });

  // Send confirmation message
  const claimer = payload.user.id;
  const poster = payload.message.blocks[0].text.text;

  // Use Regex to get the user id from the first block
  const regex = /<@(.*)>/;
  const posterID = poster.match(regex)[1];

  slack.chat.postMessage({
    channel: posterID,
    text: `*<@${claimer}>* claimed your <${taskAddress}|task>.`,
    unfurl_links: false,
  });

  try {
    // Update the message
    const message = await slack.chat.update({
      channel: payload.channel.id,
      ts: payload.message.ts,
      blocks: [...payload.message.blocks],
    });
  } catch (error) {
    console.log(error);
  }
};

/**
 * Remove message
 */
const removeMessage = async (channel, ts) => {
  const result = await slack.chat.delete({
    channel,
    ts,
  });
};

const getUserById = async (id) => {
  const user = await slack.users.info({
    user: id,
  });

  return user.user;
};

module.exports = {
  slack,
  getMembers,
  openStudioRequestForm,
  openCommTechRequestForm,
  openMultipleTeamsRequestForm,
  openInvoiceRequestForm,
  handleStudioRequestResponse,
  handleCommTechRequestResponse,
  handleMultipleTeamsRequestResponse,
  handleInvoiceRequestResponse,
  addWorkflowInterfaceToSlack,
  claimTask,
};
