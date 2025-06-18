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
  addTaskToOpsBoard,
  addTaskToMarketingBoard,
  getMarketingCampaignOptions,
} = require("./monday");

const { getOpportunities } = require("./copper");

const { setCache, getCache } = require("./cache");

const {
  isValidHttpUrl,
  camelCaseToCapitalCase,
} = require("../helpers/helpers.js");

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

const getMemberById = async (id) => {
  const members = await getMembers();

  const member = members.find((m) => m.id === id);

  if (!member) {
    throw new Error(`Member with ID ${id} not found`);
  }

  return member;
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
 * Add Workflow Interface to Slack for a user
 */
const addWorkflowInterfaceToSlackByUser = async (user) => {
  // Get templates
  const buildAppHomeScreen = templates.buildAppHomeScreen;

  const appHomeTemplate = buildAppHomeScreen(user);

  // Send message
  return await slack.views.publish({
    user_id: user.id,
    view: appHomeTemplate,
  });
};

/**
 *
 */
const addWorkflowInterfaceToSlack = async () => {
  // Get templates
  // const appHomeTemplate = { ...templates.appHome };

  // Get list of members
  const members = await getMembers();

  // Filter members
  const filteredMembers = filterMembers(members);

  // Send message to each member
  const results = Promise.all(
    filteredMembers.map(async (member) => {
      await addWorkflowInterfaceToSlackByUser(member);
    })
  );

  return results;
};

/**
 * Remove Workflow Interface when in maintenance mode, excluding the defined user
 */
const putAppIntoMaintenanceMode = async () => {
  // Get templates
  const appMaintenance = { ...templates.appMaintenance };

  // Get list of members
  const members = await getMembers();

  // Filter members
  const filteredMembers = members.filter(
    (member) =>
      member.id !== process.env.TEST_USER &&
      member.id !== process.env.MAINTENANCE_USER
  );

  // Send message to each member
  const results = Promise.all(
    filteredMembers.map(async (member) => {
      // Send message
      return await slack.views.publish({
        user_id: member.id,
        view: appMaintenance,
      });
    })
  );

  return results;
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

  const optionGroup = categories[callbackName] ?? [
    ...new Set(Object.values(categories).flat()),
  ];

  requestModal.blocks[3].element.option_groups = _.cloneDeep(optionGroup);

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
    user: mondayUser.id ?? "",
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

  newInvoiceRequestMessageTemplate.blocks[1].fields[0].text += findField(
    fields,
    "projectClientInput"
  ).selected_option.value;

  newInvoiceRequestMessageTemplate.blocks[1].fields[1].text += findField(
    fields,
    "projectNameInput"
  ).value;

  newInvoiceRequestMessageTemplate.blocks[2].text.text += findField(
    fields,
    "projectDescriptionInput"
  ).value;

  newInvoiceRequestMessageTemplate.blocks[3].fields[0].text += findField(
    fields,
    "projectCodeInput"
  ).value;

  newInvoiceRequestMessageTemplate.blocks[3].fields[1].text += findField(
    fields,
    "projectAmountInput"
  ).value;

  newInvoiceRequestMessageTemplate.blocks[4].fields[0].text += findField(
    fields,
    "projectContactNameInput"
  ).value;

  newInvoiceRequestMessageTemplate.blocks[4].fields[1].text += findField(
    fields,
    "projectContactEmailInput"
  ).value;

  newInvoiceRequestMessageTemplate.blocks[5].fields[0].text += findField(
    fields,
    "projectDateInput"
  ).selected_date;

  newInvoiceRequestMessageTemplate.blocks[6].text.text += findField(
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
 *
 */
const handleOpsRequestResponse = async (payload) => {
  const cachedOpportunities = await getOpportunities();

  const fieldValues = Object.values(payload.view.state.values);

  // Get the user
  const user = await getUserById(payload.user.id);

  // Get the Monday user
  const mondayUser = await getMondayUserByEmail(user.profile.email);

  const selectedOpportunity = cachedOpportunities.find(
    (opportunity) =>
      opportunity.id ===
      parseInt(fieldValues[0].getOpportunityOptions.selected_option.value)
  );

  const nullFields = Object.keys(selectedOpportunity).filter(
    (key) =>
      selectedOpportunity[key] === null ||
      selectedOpportunity[key] === undefined ||
      selectedOpportunity[key] === ""
  );

  if (nullFields.length > 0) {
    const errorMessage = `*Sorry, we weren’t able to process this Ops Request.*\n\nThe following Copper fields are empty:\n\n- ${nullFields
      .map((el) => camelCaseToCapitalCase(el))
      .join("\n- ")}\n\nPlease check the opportunity and try again.`;

    await slack.chat.postMessage({
      channel: payload.user.id,
      text: errorMessage,
    });

    return;
  }

  const newTask = {
    name: selectedOpportunity.name,
    Consultant: mondayUser.id,
    "Project Code": selectedOpportunity.projectCode ?? "No ID",
    "Likely Invoice Date": new Date(
      parseInt(selectedOpportunity.likelyInvoiceDate) * 1000
    )
      .toISOString()
      .split("T")[0],
    "Submitted Date": new Date(parseInt(selectedOpportunity.submittedOn) * 1000)
      .toISOString()
      .split("T")[0],
    "Consulting Fees": parseInt(selectedOpportunity.consultingFees),
    "Studio Fees": parseInt(selectedOpportunity.studioFees),
    "Project Fees": parseInt(selectedOpportunity.projectFees),
    "Invoicing Email": `${selectedOpportunity.invoicingEmail} Link`,
    "Invoice Detail": selectedOpportunity.invoiceDetail,
  };

  const addTaskRequest = await addTaskToOpsBoard(newTask);

  const newOpsRequestMessageTemplate = _.cloneDeep(
    templates.newOpsRequestMessage
  );

  newOpsRequestMessageTemplate.blocks[0].text.text = `*<@${payload.user.id}>* submitted a new Ops Request:`;
  newOpsRequestMessageTemplate.blocks[1].fields[0].text +=
    selectedOpportunity.name;
  newOpsRequestMessageTemplate.blocks[1].fields[1].text +=
    selectedOpportunity.projectCode ?? "No ID";

  newOpsRequestMessageTemplate.blocks[2].elements[0].value = JSON.stringify({
    boardId: process.env.OPS_MONDAY_BOARD,
    itemId: addTaskRequest.data.create_item.id,
  });
  newOpsRequestMessageTemplate.blocks[2].elements[1].url = `https://iwcrew.monday.com/boards/${process.env.OPS_MONDAY_BOARD}/pulses/${addTaskRequest.data.create_item.id}`;
  newOpsRequestMessageTemplate.blocks[2].elements[2].url =
    process.env.COPPER_OPPORTUNITY_URL + selectedOpportunity.id;

  try {
    // Send message to users
    const message = await slack.chat.postMessage({
      channel: process.env.OPS_SLACK_CHANNEL,
      ...newOpsRequestMessageTemplate,
    });
  } catch (error) {
    console.log(error);
  }
};

/**
 *
 */
const handleMarketingRequestResponse = async (payload) => {
  const fieldValues = Object.values(payload.view.state.values);

  // Get the user
  const user = await getUserById(payload.user.id);

  // Get the Monday user
  const mondayUser = await getMondayUserByEmail(user.profile.email);

  const reviewerSlackUser = await getUserById(
    fieldValues.find((f) => f.hasOwnProperty("reviewerSelect")).reviewerSelect
      .selected_user
  );

  console.log("Reviewer Slack user", reviewerSlackUser);

  const reviewerMondayUser = await getMondayUserByEmail(
    reviewerSlackUser.profile.email
  );

  console.log("Reviewer Monday user", reviewerMondayUser);

  const newTask = {
    name: fieldValues.find((f) => f.hasOwnProperty("projectNameInput"))
      .projectNameInput.value,
    "Requested by": mondayUser.id,
    Reviewer: reviewerMondayUser.id,
    "Review Date": fieldValues.find((f) => f.hasOwnProperty("reviewDateInput"))
      .reviewDateInput.selected_date,
    "Go-Live Date": fieldValues.find((f) => f.hasOwnProperty("goLiveDateInput"))
      .goLiveDateInput.selected_date,
    Description: fieldValues.find((f) =>
      f.hasOwnProperty("projectDescriptionInput")
    ).projectDescriptionInput.value,
    "Dropbox Link":
      fieldValues.find((f) => f.hasOwnProperty("dropboxLinkInput"))
        .dropboxLinkInput.value + " Link",
    Channel: fieldValues.find((f) => f.hasOwnProperty("channelSelect"))
      .channelSelect.selected_option.value,
  };

  // console.log("New task", newTask);

  const addTaskRequest = await addTaskToMarketingBoard(newTask);

  const newMarketingRequestMessageTemplate = _.cloneDeep(
    templates.newMarketingRequestMessage
  );

  newMarketingRequestMessageTemplate.blocks[0].text.text = `*<@${payload.user.id}>* submitted a new Marketing Request:`;
  newMarketingRequestMessageTemplate.blocks[1].fields[0].text += newTask.name;
  newMarketingRequestMessageTemplate.blocks[1].fields[1].text +=
    newTask.Channel;
  newMarketingRequestMessageTemplate.blocks[2].text.text += newTask.Description;
  newMarketingRequestMessageTemplate.blocks[3].fields[0].text +=
    newTask["Review Date"];
  newMarketingRequestMessageTemplate.blocks[3].fields[1].text +=
    newTask["Go-Live Date"];
  newMarketingRequestMessageTemplate.blocks[4].elements[0].value =
    JSON.stringify({
      boardId: process.env.MARKETING_MONDAY_BOARD,
      itemId: addTaskRequest.data.create_item.id,
    });
  newMarketingRequestMessageTemplate.blocks[4].elements[1].url = `https://iwcrew.monday.com/boards/${process.env.MARKETING_MONDAY_BOARD}/pulses/${addTaskRequest.data.create_item.id}`;

  if (isValidHttpUrl(newTask["Dropbox Link"])) {
    newMarketingRequestMessageTemplate.blocks[4].elements[2].url =
      newTask["Dropbox Link"];
  } else {
    newMarketingRequestMessageTemplate.blocks[4].elements.splice(2, 1);
  }

  try {
    // Send message to users
    const message = await slack.chat.postMessage({
      channel: process.env.MARKETING_SLACK_CHANNEL,
      ...newMarketingRequestMessageTemplate,
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

  // Find the actions block location
  const actionsBlockIndex = payload.message.blocks.findIndex(
    (block) => block.type === "actions"
  );

  const taskAddress = payload.message.blocks[actionsBlockIndex].elements[1].url;

  const { boardId, itemId } = JSON.parse(payload.actions[0].value);

  // Update the task
  await updateAssignedUser(mondayUser.id, itemId, boardId);

  // Remove the claim button
  payload.message.blocks[actionsBlockIndex].elements.splice(0, 1);

  // Add a block showing the user who claimed the task
  payload.message.blocks.splice(actionsBlockIndex, 0, {
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

const getOpportunityOptions = async (payload) => {
  console.log("Search term", payload.value);

  const opportunities = await getOpportunities();

  const options = opportunities
    .sort((a, b) => {
      if (a.projectCode && b.projectCode) {
        return a.projectCode.localeCompare(b.projectCode);
      } else if (a.projectCode) {
        return -1;
      } else if (b.projectCode) {
        return 1;
      }
      return 0;
    })
    .filter((opportunity) => {
      const searchTerm = payload.value.toLowerCase();
      return (
        opportunity.name.toLowerCase().includes(searchTerm) ||
        opportunity.projectCode?.toLowerCase().includes(searchTerm) ||
        opportunity.stageName.toLowerCase().includes(searchTerm)
      );
    })
    .slice(0, 100);

  const option_groups = options.reduce((acc, option) => {
    const optionGroup = acc.find(
      (optionGroup) => optionGroup.label.text === option.stageName
    );

    if (optionGroup) {
      optionGroup.options.push({
        text: {
          type: "plain_text",
          text: `${option.name} (${option.projectCode || "No ID"})`.substring(
            0,
            75
          ),
          emoji: true,
        },
        value: String(option.id),
      });

      return acc;
    }

    acc.push({
      label: {
        type: "plain_text",
        text: option.stageName,
        emoji: true,
      },
      options: [
        {
          text: {
            type: "plain_text",
            text: `${option.name} (${option.projectCode || "No ID"})`.substring(
              0,
              75
            ),
            emoji: true,
          },
          value: String(option.id),
        },
      ],
    });

    return acc;
  }, []);

  return {
    option_groups,
  };
};

const openOpsRequestForm = async (payload) => {
  const opsRequestModal = _.cloneDeep(templates.opsRequestModal);

  try {
    // Send leave request form to Slack
    const result = await slack.views.open({
      trigger_id: payload.trigger_id,
      view: opsRequestModal,
    });
  } catch (error) {
    console.dir(error, { depth: null });
  }
};

const openMarketingRequestForm = async (payload) => {
  const marketingRequestModal = _.cloneDeep(templates.marketingRequestModal);

  // Add select field for marketing campaigns

  const campaignSelectFieldIndex = marketingRequestModal.blocks.findIndex(
    (block) =>
      block.type === "input" && block.element.action_id === "campaignSelect"
  );

  const marketingCampaignOptions = await getMarketingCampaignOptions();

  marketingRequestModal.blocks[campaignSelectFieldIndex].element.options =
    marketingCampaignOptions.map((option) => ({
      text: {
        type: "plain_text",
        text: option.name,
        emoji: true,
      },
      value: option.id.toString(),
    }));

  try {
    // Send leave request form to Slack
    const result = await slack.views.open({
      trigger_id: payload.trigger_id,
      view: marketingRequestModal,
    });
  } catch (error) {
    console.dir(error, { depth: null });
  }
};

module.exports = {
  slack,
  getMembers,
  getMemberById,
  openStudioRequestForm,
  openCommTechRequestForm,
  openOpsRequestForm,
  openMultipleTeamsRequestForm,
  openInvoiceRequestForm,
  openMarketingRequestForm,
  handleStudioRequestResponse,
  handleCommTechRequestResponse,
  handleMultipleTeamsRequestResponse,
  handleInvoiceRequestResponse,
  handleOpsRequestResponse,
  handleMarketingRequestResponse,
  addWorkflowInterfaceToSlack,
  addWorkflowInterfaceToSlackByUser,
  putAppIntoMaintenanceMode,
  claimTask,
  getOpportunityOptions,
};
