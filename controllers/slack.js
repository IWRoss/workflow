/**
 * Slack controller
 *
 * This controller handles all of our interactions with Slack
 */
const { WebClient } = require("@slack/web-api");

const { db } = require("./firestore");

const {
  addDesignRequest,
  getMondayUserByEmail,
  updateAssignedUser,
} = require("./monday");

const { isValidHttpUrl } = require("../helpers/helpers.js");

/**
 * Import templates
 */
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
const addDesignRequestInterfaceToSlack = async () => {
  // Get list of members
  const members = await getMembers();

  // Filter members
  const filteredMembers = filterMembers(members);

  // Send message to each member
  filteredMembers.forEach(async (member) => {
    // Send message
    await slack.views.publish({
      user_id: member.id,
      view: templates.appHome,
    });
  });
};

/**
 * Open Leave Request Form
 */
const openDesignRequestForm = async (payload) => {
  // Get leave request form template
  const template = templates.requestLeaveModal;

  try {
    // Send leave request form to Slack
    const result = await slack.views.open({
      trigger_id: payload.trigger_id,
      view: templates.designRequestModal,
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
 * Handle Leave Request Response
 */
const handleDesignRequestResponse = async (payload) => {
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

  // Add the task to Monday.com
  const result = await addDesignRequest(newTask);

  // Get template
  let template = templates.newRequestMessage;

  template.blocks[0].text.text = `*<@${payload.user.id}>* submitted a new studio request:`;
  template.blocks[1].fields[0].text += newTask.client;
  template.blocks[1].fields[1].text += newTask.media;
  template.blocks[2].fields[0].text += newTask.producerDeadline;
  template.blocks[2].fields[1].text += newTask.clientDeadline;
  template.blocks[3].text.text += newTask.notes;
  template.blocks[4].elements[0].value = result.data.create_item.id;
  template.blocks[4].elements[1].url = `https://iwcrew.monday.com/boards/${process.env.MONDAY_BOARD}/pulses/${result.data.create_item.id}`;

  if (isValidHttpUrl(newTask.dropboxLink)) {
    template.blocks[4].elements[2].url = newTask.dropboxLink;
  } else {
    template.blocks[4].elements.splice(2, 1);
  }

  try {
    // Send message to users
    const message = await slack.chat.postMessage({
      channel: process.env.SLACK_CHANNEL,
      ...template,
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

  // Update the task
  await updateAssignedUser(mondayUser.id, payload.actions[0].value);

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
  openDesignRequestForm,
  handleDesignRequestResponse,
  addDesignRequestInterfaceToSlack,
  claimTask,
};
