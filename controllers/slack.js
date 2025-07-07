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

const { getOpportunity } = require("./copper");

const { setCache, getCache } = require("./cache");

const {
    isValidHttpUrl,
    camelCaseToCapitalCase,
} = require("../helpers/helpers.js");

const templates = require("../templates");

//Oportunity custom field map
// This map is used to convert Copper custom field IDs
const opportunityCustomFieldMap = {
    631912: "projectCode",
    22023: "likelyInvoiceDate",
    681214: "internationalProject",
    681471: "submittedOn",
    692217: "invoiceDetail",
    689554: "projectFees",
    689552: "consultingFees",
    689553: "studioFees",
    692218: "invoicingEmail",
    699619: "totalDays",
};

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
        (m) =>
            !m.is_bot &&
            !m.deleted &&
            !m.is_restricted &&
            !m.is_ultra_restricted
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

        let newRequestMessageTemplate = _.cloneDeep(
            templates.newRequestMessage
        );

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
            newRequestMessageTemplate.blocks[4].elements[2].url =
                newTask.dropboxLink;
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
    console.log("Payload inside handleOpsRequestResponse", payload);
    //1.Request all the members of the Slack workspace
    const slackMembers = await getMembers();

    //2. Get the opportunity object from the payload
    const selectedOpportunity = payload.opportunityObject;
    console.log("Selected opportunity", selectedOpportunity);

    //3. Map the custom fields
    const customFields = mapCustomFields(selectedOpportunity.custom_fields);
    console.log("Custom fields", customFields);

    //4. Find copper user that moved the opportunity to the "Proposal Submitted" stage
    const copperUser = payload.copperUsers.filter(
        (user) => user.id === selectedOpportunity.assignee_id
    );

    console.log("Selected copper user", copperUser);

    //5. Get the Consultant Monday user by email
    const mondayConsultantUser = await getMondayUserByEmail(
        copperUser[0].email
    );

    console.log("Consultant Monday user", mondayConsultantUser);

    //6. Find the consultants slack user
    const consultantSlackUser = slackMembers.find(
        (member) => member.profile.email === copperUser[0].email
    );

    console.log("Consultant Slack user", consultantSlackUser);

    //7. Create a new Ops Request message template
    const newOpsRequestMessageTemplate = _.cloneDeep(
        templates.newOpsRequestMessage
    );

    //8. Check if there are any null fields in the selectedOpportunity object
    const nullFields = Object.keys(customFields).filter(
        (key) =>
            customFields[key] === null ||
            customFields[key] === undefined ||
            customFields[key] === ""
    );

    // If there are, add a warning block with the null fields
    if (nullFields.length > 0) {
        const warningMessage = `*Missing Fields:*\n - ${nullFields
            .map((el) => camelCaseToCapitalCase(el))
            .join("\n - ")}`;

        //Add a text block to the message
        newOpsRequestMessageTemplate.blocks[1].fields.push({
            type: "mrkdwn",
            text: warningMessage,
        });
    }

    //Initial top text
    newOpsRequestMessageTemplate.blocks[0].text.text = `*@${consultantSlackUser.name}*'s proposal was moved to "Proposal Submitted":`;
    //Name of the opportunity
    newOpsRequestMessageTemplate.blocks[1].fields[0].text +=
        selectedOpportunity.name;
    //Project code
    newOpsRequestMessageTemplate.blocks[1].fields[1].text +=
        customFields.projectCode ||
        payload.opportunityProjectCodeUpdated ||
        "No ID";

    //Create a monday task button
    newOpsRequestMessageTemplate.blocks[2].elements[0].value = JSON.stringify({
        consultantSlackUser,
        oppId: selectedOpportunity.id,
        opportunityProjectCodeUpdated: payload.opportunityProjectCodeUpdated,
        mondayConsultantUser,
    });

    newOpsRequestMessageTemplate.blocks[2].elements[2].url =
        process.env.COPPER_OPPORTUNITY_URL + selectedOpportunity.id;

    //No action required button
    newOpsRequestMessageTemplate.blocks[2].elements[1].value =
        "noActionRequired";

    try {
        // Send message to users
        const message = await slack.chat.postMessage({
            channel: process.env.OPS_SLACK_CHANNEL,
            text: `A proposal was moved to "Proposal Submitted": ${selectedOpportunity.name} `,

            ...newOpsRequestMessageTemplate,
        });

        await slack.chat.postMessage({
            channel: process.env.OPS_SLACK_CHANNEL,
            thread_ts: message.ts,
            text: `<@${consultantSlackUser.id}> please state if there are any actions required for this task.`,
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
        fieldValues.find((f) => f.hasOwnProperty("reviewerSelect"))
            .reviewerSelect.selected_user
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
        "Review Date": fieldValues.find((f) =>
            f.hasOwnProperty("reviewDateInput")
        ).reviewDateInput.selected_date,
        "Go-Live Date": fieldValues.find((f) =>
            f.hasOwnProperty("goLiveDateInput")
        ).goLiveDateInput.selected_date,
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
    newMarketingRequestMessageTemplate.blocks[2].text.text +=
        newTask.Description;
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

//No action required
const noActionRequired = async (payload) => {
    // Find the actions block location
    const actionsBlockIndex = payload.message.blocks.findIndex(
        (block) => block.type === "actions"
    );

    console.log(
        "Actions block index",
        payload.message.blocks[actionsBlockIndex].elements
    );

    // Remove the "No Action Required"
    payload.message.blocks[actionsBlockIndex].elements.splice(1, 1);
    // Remove the "Create Task" button
    payload.message.blocks[actionsBlockIndex].elements.splice(0, 1);

    // Add a block showing that no action is required
    payload.message.blocks.splice(actionsBlockIndex, 0, {
        type: "section",
        text: {
            type: "mrkdwn",
            text: `*<@${payload.user.id}>* marked this task as no action required`,
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

//Map custom fields function
const mapCustomFields = (customFieldsObject) => {
    return customFieldsObject.reduce((acc, field) => {
        if (opportunityCustomFieldMap[field.custom_field_definition_id]) {
            acc[opportunityCustomFieldMap[field.custom_field_definition_id]] =
                field.value;
        }
        return acc;
    }, {});
};

/**
 * Create a task on Monday for user (DevOps)
 */

const createTask = async (payload) => {
    console.log("Going through createTask", payload);

    //1. Parse the payload actions
    const parsedPayload = JSON.parse(payload.actions[0].value);
    console.log("Parsed payload", parsedPayload);

    //2. Get slack user that claimed
    const slackCreateTaskUser = await getUserById(payload.user.id);

    //3. Get the Monday user which the task is assigned to
    const mondayAssignedUser = await getMondayUserByEmail(
        slackCreateTaskUser.profile.email
    );

    //4. Get Opportunity object from copper
    const selectedOpportunity = await getOpportunity(parsedPayload.oppId);
    console.log("Opportunity object", selectedOpportunity);

    //5. Map the custom fields from the opportunity object
    const customFields = mapCustomFields(selectedOpportunity.custom_fields);
    console.log("Custom fields object", customFields);

    //9. Create a new task object for Monday.com
    const newTask = {
        name: selectedOpportunity.name,
        Consultant: parsedPayload.mondayConsultantUser.id,
        "Project Code":
            customFields.projectCode ||
            parsedPayload.opportunityProjectCodeUpdated ||
            "No ID",
        "Likely Invoice Date": new Date(
            parseInt(customFields.likelyInvoiceDate) * 1000
        )
            .toISOString()
            .split("T")[0],
        "Submitted Date": new Date(parseInt(customFields.submittedOn) * 1000)
            .toISOString()
            .split("T")[0],
        "Consulting Fees": parseInt(customFields.consultingFees),
        "Studio Fees": parseInt(customFields.studioFees),
        "Project Fees": parseInt(customFields.projectFees),
        "Invoicing Email": `${customFields.invoicingEmail} Link`,
        "Invoice Detail": customFields.invoiceDetail,
        "Total Days": customFields.totalDays,
    };

    //10. Create a new task on Monday.com
    const addTaskRequest = await addTaskToOpsBoard(newTask);

    //11. Update the assigned user on the task
    await updateAssignedUser(
        mondayAssignedUser.id,
        addTaskRequest.data.create_item.id,
        process.env.OPS_MONDAY_BOARD
    );

    //12. Find the actions block location
    const actionsBlockIndex = payload.message.blocks.findIndex(
        (block) => block.type === "actions"
    );

    //13. Remove the claim button and no action required button
    payload.message.blocks[actionsBlockIndex].elements.splice(0, 1);
    payload.message.blocks[actionsBlockIndex].elements.splice(1, 1);

    //14. Add a button block to view on Monday.com after the task is created
    payload.message.blocks[actionsBlockIndex].elements.push({
        type: "button",
        text: {
            type: "plain_text",
            text: "📋 View on Monday",
        },
        url: `https://iwcrew.monday.com/boards/${process.env.MARKETING_MONDAY_BOARD}/pulses/${addTaskRequest.data.create_item.id}`,
        action_id: "view_monday",
    });

    payload.message.blocks.splice(actionsBlockIndex, 0, {
        type: "section",
        text: {
            type: "mrkdwn",
            text: `*<@${payload.user.id}>* created a task on Monday`,
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

    const taskAddress =
        payload.message.blocks[actionsBlockIndex].elements[1].url;

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

// const getOpportunityOptions = async (payload) => {
//   console.log("Search term", payload.value);

//   const opportunities = await getOpportunities();

//   const options = opportunities
//     .sort((a, b) => {
//       if (a.projectCode && b.projectCode) {
//         return a.projectCode.localeCompare(b.projectCode);
//       } else if (a.projectCode) {
//         return -1;
//       } else if (b.projectCode) {
//         return 1;
//       }
//       return 0;
//     })
//     .filter((opportunity) => {
//       const searchTerm = payload.value.toLowerCase();
//       return (
//         opportunity.name.toLowerCase().includes(searchTerm) ||
//         opportunity.projectCode?.toLowerCase().includes(searchTerm) ||
//         opportunity.stageName.toLowerCase().includes(searchTerm)
//       );
//     })
//     .slice(0, 100);

//   const option_groups = options.reduce((acc, option) => {
//     const optionGroup = acc.find(
//       (optionGroup) => optionGroup.label.text === option.stageName
//     );

//     if (optionGroup) {
//       optionGroup.options.push({
//         text: {
//           type: "plain_text",
//           text: `${option.name} (${option.projectCode || "No ID"})`.substring(
//             0,
//             75
//           ),
//           emoji: true,
//         },
//         value: String(option.id),
//       });

//       return acc;
//     }

//     acc.push({
//       label: {
//         type: "plain_text",
//         text: option.stageName,
//         emoji: true,
//       },
//       options: [
//         {
//           text: {
//             type: "plain_text",
//             text: `${option.name} (${option.projectCode || "No ID"})`.substring(
//               0,
//               75
//             ),
//             emoji: true,
//           },
//           value: String(option.id),
//         },
//       ],
//     });

//     return acc;
//   }, []);

//   return {
//     option_groups,
//   };
// };

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
            block.type === "input" &&
            block.element.action_id === "campaignSelect"
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
    createTask,
    noActionRequired,
};
