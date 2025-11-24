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
    addTaskToBoardWithColumns,
    getAllTaskRowsFromBoard,
    linkTaskToProject,
} = require("./monday");

const { getOpportunity } = require("./copper");

const { setCache, getCache } = require("./cache");

const {
    isValidHttpUrl,
    camelCaseToCapitalCase,
} = require("../helpers/helpers.js");

const templates = require("../templates");
const { stringify } = require("nodemon/lib/utils/index.js");
const clients = require("../data/clients.js");
const { generateTitleFromRequest } = require("./openai.js");

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
    console.log("Payload inside openRequestForm", payload);
    console.log("Callback name inside openRequestForm", callbackName);

    try {
        // Clone the modal template (it's an object, not a function)
        const modalView = _.cloneDeep(templates.requestModal);

        modalView.callback_id =
            callbackName || "handleMultipleTeamsRequestResponse";

        const categories = require("../data/categories");

        /**
         * Define a const theCategories containing either the categories corresponding to the callbackName,
         * or, if that does not exist, flatten the categories object and return all values, removing duplicates
         */

        const optionGroup = categories[callbackName] ?? [
            ...new Set(Object.values(categories).flat()),
        ];

        //Get cached project codes
        let projectOptions = getCache("mondayProjectOptions");

       
        

        if (!projectOptions) {

            // If not cached, fetch and cache for 1 hour
            const rows = await getAllTaskRowsFromBoard(
                process.env.OPS_MONDAY_BOARD
            );
            
            projectOptions = rows.map((row) => {
                const displayName =
                    row.name.length > 75 ? `${row.name.slice(0, 72)}...` : row.name;

                return {
                    text: {
                        type: "plain_text",
                        text: displayName,
                        emoji: true,
                    },
                    value: row.projectCode,
                };
            });
            
            // Cache for 1 hour (3600000 milliseconds)
            setCache("mondayProjectOptions", projectOptions, 3600000);
        }

           modalView.blocks[0].element.options = projectOptions;

        // Update the media/categories dropdown (block index 4)
        modalView.blocks[4].element.option_groups = optionGroup;

        // Send leave request form to Slack
        const result = await slack.views.open({
            trigger_id: payload.trigger_id,
            view: modalView,
        });
    } catch (error) {
        await reportErrorToSlack(error, "openRequestForm");
        console.log(error);
    }
};

const openStudioRequestForm = async (payload) =>
    openRequestForm(payload, "handleStudioRequestResponse");

const openCommTechRequestForm = async (payload) =>
    openRequestForm(payload, "handleCommTechRequestResponse");

const openMultipleTeamsRequestForm = async (payload) =>
    openRequestForm(payload, "handleMultipleTeamsRequestResponse");

const openSpendRequestForm = async (payload) =>
    openSpendRequestFormWithTemplate(payload, "handleSpendRequestResponse");

const openCustomerComplaintForm = async (payload) =>
    openFormWithCustomTemplate(
        payload,
        "handleCustomerComplaintResponse",
        templates.customerComplaintModal
    );

const openOpportunityToImproveForm = async (payload) =>
    openFormWithCustomTemplate(
        payload,
        "handleOpportunityToImproveResponse",
        templates.opportunityToImproveModal
    );

const openInvoiceRequestForm = async (payload) => {
    const invoiceRequestModal = _.cloneDeep(templates.invoiceRequestModal);

    try {
        // Send leave request form to Slack
        const result = await slack.views.open({
            trigger_id: payload.trigger_id,
            view: invoiceRequestModal,
        });
    } catch (error) {
        await reportErrorToSlack(error, "openInvoiceRequestForm");

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
 * Handle Customer Complaint Response (No Monday Board Integration)
 */

const generateNextId = (existingIds) => {
    const numericIds = existingIds
        .map((id) => parseInt(id, 10))
        .filter((n) => !isNaN(n));

    const maxId = Math.max(...numericIds, 0); // start from 1
    return maxId + 1;
};

const handleCustomerComplaint = async (payload, locations) => {
    const {
        addRowToGoogleSheets,
        getColumnValues,
    } = require("../helpers/helpers.js");

    console.log("handleCustomerComplaint");
    console.log("Payload inside handleCustomerComplaint", payload);
    console.log("Locations inside handleCustomerComplaint", locations);

    //Get the fields from the slack payload and its values
    const fields = Object.values(payload.view.state.values);

    const fieldsPayload = {
        ISOAreaSelected: findField(fields, "areaSelect").selected_option.value,
        ISOCustomerComplaintText: findField(fields, "complaintText").value,
        ISOCustomerComplaintPriority: findField(fields, "prioritySelect")
            .selected_option.value,
        ISOCustomerComplaintRaisedDate: new Date(),
    };
    console.log("fieldsPayload", fieldsPayload);

    // Add to Google Sheets
    console.log("Adding accepted spend request to Google Sheets");

    // Get existing IDs from Google Sheets (column A)
    const rawExistingIds = await getColumnValues({
        spreadsheetId:
            process.env.GOOGLE_SHEETS_SPREADSHEET_ID_CUSTOMER_COMPLAINTS,
        range: "Sheet1!A:A",
    });

    //Remove any non-numeric values from the existing IDs
    const existingIdsFlat = rawExistingIds.filter((v) => /^\d+$/.test(v));

    // Compute the next sequential ID
    const nextId = generateNextId(existingIdsFlat);

    //Prepare the rows
    const rowData = [
        String(nextId),
        "Open",
        fieldsPayload.ISOAreaSelected,
        fieldsPayload.ISOCustomerComplaintPriority,
        fieldsPayload.ISOCustomerComplaintText,
        new Date(fieldsPayload.ISOCustomerComplaintRaisedDate)
            .toISOString()
            .split("T")[0],
    ];

    try {
        const addToGoogleSheets = await addRowToGoogleSheets(rowData, {
            spreadsheetId:
                process.env.GOOGLE_SHEETS_SPREADSHEET_ID_CUSTOMER_COMPLAINTS,
            range: "Sheet1!A:H",
        });

        if (addToGoogleSheets.success) {
            console.log(
                "Customer complaint added to Google Sheets successfully"
            );
            console.log("Updated range:", addToGoogleSheets.updatedRange);
        }
    } catch (error) {
        await reportErrorToSlack(error, "handleCustomerComplaint");
        console.log(error);
    }

    // Return a success message
    return {
        status: "success",
        message: "Customer Complaint submitted successfully.",
    };
};

/**
 * Handle Opportunity to Improve Response (No Monday Board Integration)
 */

const handleOpportunityToImprove = async (payload, locations) => {
    const {
        addRowToGoogleSheets,
        getColumnValues,
    } = require("../helpers/helpers.js");

    console.log("handleOpportunityToImprove");
    console.log("Payload inside handleOpportunityToImprove", payload);
    console.log("Locations inside handleOpportunityToImprove", locations);

    //Get the fields from the slack payload and its values
    const fields = Object.values(payload.view.state.values);

    const fieldsPayload = {
        ISOAreaSelected: findField(fields, "areaSelect").selected_option.value,
        ISOOpportunityToImproveText: findField(
            fields,
            "opportunityToImproveText"
        ).value,
        ISOOpportunityToImprovePriority: findField(fields, "prioritySelect")
            .selected_option.value,
        ISOOpportunityToImproveRaisedDate: new Date(),
    };
    console.log("fieldsPayload", fieldsPayload);

    //Custom message template to display on slack
    let newOpportunityToImproveTemplate = _.cloneDeep(
        templates.newOpportunityToImproveMessage
    );

    // Populate the template
    newOpportunityToImproveTemplate.blocks[0].text.text = `*<@${payload.user.id}>* submitted a new Opportunity To Improve:`;

    // Department and Priority (side by side)
    newOpportunityToImproveTemplate.blocks[1].fields[0].text = `*Department:*\n${fieldsPayload.ISOAreaSelected}`;
    newOpportunityToImproveTemplate.blocks[1].fields[1].text = `*Priority:*\n${fieldsPayload.ISOOpportunityToImprovePriority}`;

    // Complaint Details
    newOpportunityToImproveTemplate.blocks[2].text.text = `*Opportunity To Improve Details:*\n${fieldsPayload.ISOOpportunityToImproveText}`;

    // Raised Date - Format 00/MM/YYYY
    newOpportunityToImproveTemplate.blocks[3].fields[0].text = `*Raised Date:*\n${new Date(
        fieldsPayload.ISOOpportunityToImproveRaisedDate
    ).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })}`;

    const { slackChannel } = locations[0];

    const existingIds = await getColumnValues({
        spreadsheetId:
            process.env.GOOGLE_SHEETS_SPREADSHEET_ID_OPPORTUNITY_TO_IMPROVE,
        range: "Sheet1!A:A",
    });

    // Remove any non-numeric values from the existing IDs
    const existingIdsFlat = existingIds.filter((v) => /^\d+$/.test(v));

    // Compute the next sequential ID
    const id = generateNextId(existingIdsFlat);

    // Add to Google Sheets
    console.log("Adding accepted spend request to Google Sheets");
    //Prepare the rows
    const rowData = [
        id,
        "Open",
        payload.user.id,
        payload.user.name,
        fieldsPayload.ISOAreaSelected,
        fieldsPayload.ISOOpportunityToImprovePriority,
        fieldsPayload.ISOOpportunityToImproveText,
        new Date(fieldsPayload.ISOOpportunityToImproveRaisedDate)
            .toISOString()
            .split("T")[0],
    ];

    try {
        const addToGoogleSheets = await addRowToGoogleSheets(rowData, {
            spreadsheetId:
                process.env.GOOGLE_SHEETS_SPREADSHEET_ID_OPPORTUNITY_TO_IMPROVE,
            range: "Sheet1!A:H",
        });

        if (addToGoogleSheets.success) {
            console.log(
                "Opportunity To Improve added to Google Sheets successfully"
            );
            console.log("Updated range:", addToGoogleSheets.updatedRange);
        }
    } catch (error) {
        await reportErrorToSlack(error, "handleOpportunityToImprove");
        console.log(error);
    }

    try {
        const message = await slack.chat.postMessage({
            channel: slackChannel,
            ...newOpportunityToImproveTemplate,
        });
    } catch (error) {
        await reportErrorToSlack(error, "handleOpportunityToImprove");
        console.log(error);
    }

    // Return a success message
    return {
        status: "success",
        message: "Opportunity to Improve submitted successfully.",
    };
};

/**
 * Handle Spend Request Response (No Monday Board Integration)
 */

const handleSpendRequest = async (payload, locations) => {
    console.log("Payload inside handleRequestResponse", payload);
    console.log("Locations inside handleRequestResponse", locations);

    //Get the fields from the slack payload and its values
    const fields = Object.values(payload.view.state.values);

    const fieldsPayload = {
        spendType: findField(fields, "spendRequestTypeSelect").selected_option
            .value,
        department: findField(fields, "departmentSelect").selected_option.value,
        client: findField(fields, "clientSelect").selected_option.value,
        projectCode: findField(fields, "projectCode").value,
        notes: findField(fields, "notes").value,
        numberOfAttendees: findField(fields, "number_of_attendees").value,
        numberOfClients: findField(fields, "number_of_clients").value,
        numberOfInternalStaff: findField(fields, "number_of_internal_staff")
            .value,
    };

    //Custom message template to display on slack
    let newSpendRequestMessageTemplate = _.cloneDeep(
        templates.newSpendRequestMessage
    );

    //Display the user who submitted the request
    newSpendRequestMessageTemplate.blocks[0].text.text = `*<@${payload.user.id}>* submitted a new Spend Request:`;

    // Spend Type and Department (side by side)
    newSpendRequestMessageTemplate.blocks[1].fields[0].text = `*Spend Type:*\n${fieldsPayload.spendType}`;
    newSpendRequestMessageTemplate.blocks[1].fields[1].text = `*Department:*\n${fieldsPayload.department}`;

    // Client and Project Code (side by side)
    newSpendRequestMessageTemplate.blocks[2].fields[0].text = `*Client:*\n${fieldsPayload.client}`;
    newSpendRequestMessageTemplate.blocks[2].fields[1].text = `*Project Code:*\n${fieldsPayload.projectCode}`;

    // Notes
    newSpendRequestMessageTemplate.blocks[3].text.text = `*Notes:*\n${fieldsPayload.notes}`;

    console.log("numberOfAttendees", fieldsPayload.numberOfAttendees);
    console.log("numberOfClients", fieldsPayload.numberOfClients);
    console.log("numberOfInternalStaff", fieldsPayload.numberOfInternalStaff);

    //Object for additional blocks
    const additionalBlocks = [];

    if (
        fieldsPayload.numberOfAttendees !== "0" &&
        fieldsPayload.numberOfAttendees !== 0
    ) {
        additionalBlocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Number of Attendees:*\n${fieldsPayload.numberOfAttendees}`,
            },
        });
    }

    if (
        fieldsPayload.numberOfClients !== "0" &&
        fieldsPayload.numberOfClients !== 0
    ) {
        additionalBlocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Number of Clients:*\n${fieldsPayload.numberOfClients}`,
            },
        });
    }

    if (
        fieldsPayload.numberOfInternalStaff !== "0" &&
        fieldsPayload.numberOfInternalStaff !== 0
    ) {
        additionalBlocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Number of Internal Staff:*\n${fieldsPayload.numberOfInternalStaff}`,
            },
        });
    }

    console.log("RequestBy", payload.user.name);
    console.log("requestedBy", payload.user.name);

    //Get user slack details
    const user = await getMemberById(payload.user.id);
    console.log("User", user);

    // Approve button
    newSpendRequestMessageTemplate.blocks[5].elements[0].value = JSON.stringify(
        {
            action: "Approved",
            requestId: `spend_${Date.now()}`,
            requestedBy: user.real_name,
            userId: payload.user.id,
            spendType: fieldsPayload.spendType,
            department: fieldsPayload.department,
            client: fieldsPayload.client,
            projectCode: fieldsPayload.projectCode,
            notes: fieldsPayload.notes,
            submittedAt: new Date().toISOString(),
            numberOfAttendees: fieldsPayload.numberOfAttendees,
            numberOfClients: fieldsPayload.numberOfClients,
            numberOfInternalStaff: fieldsPayload.numberOfInternalStaff,
        }
    );

    // Decline button
    newSpendRequestMessageTemplate.blocks[5].elements[1].value = JSON.stringify(
        {
            action: "Declined",
            requestId: `spend_${Date.now()}`,
            requestedBy: user.real_name,
            userId: payload.user.id,
            spendType: fieldsPayload.spendType,
            department: fieldsPayload.department,
            client: fieldsPayload.client,
            projectCode: fieldsPayload.projectCode,
            notes: fieldsPayload.notes,
            submittedAt: new Date().toISOString(),
            numberOfAttendees: fieldsPayload.numberOfAttendees,
            numberOfClients: fieldsPayload.numberOfClients,
            numberOfInternalStaff: fieldsPayload.numberOfInternalStaff,
        }
    );

    if (additionalBlocks.length > 0) {
        console.log("Adding additional blocks");

        const combinedBlock = {
            type: "section",
            fields: [],
        };

        additionalBlocks.forEach((block) => {
            combinedBlock.fields.push({
                type: "mrkdwn",
                text: block.text.text,
            });
        });

        newSpendRequestMessageTemplate.blocks.splice(4, 0, combinedBlock);
    }

    //Separate monday board id and slack channel from locations
    const { boardId, slackChannel } = locations[0];

    //Send a message to slack channel
    try {
        // Send message to users
        const message = await slack.chat.postMessage({
            channel: slackChannel,
            ...newSpendRequestMessageTemplate,
        });
    } catch (error) {
        await reportErrorToSlack(error, "handleSpendRequest");
        console.log(error);
    }

    // Return a success message
    return {
        status: "success",
        message: "Spend request submitted successfully.",
    };
};

/**
 * Handle Request Response
 */
const handleRequestResponse = async (payload, locations) => {
    console.log(
        "Payload inside handleRequestResponse",
        payload.view.blocks[0].element
    );
    console.log("Locations inside handleRequestResponse", locations);
    const fields = Object.values(payload.view.state.values);

    console.log("All fields:", JSON.stringify(fields, null, 2));


    // Get the user
    const user = await getUserById(payload.user.id);

    // Get the Monday user
    const mondayUser = await getMondayUserByEmail(user.profile.email);

    // const newTask = {
    //     user: mondayUser.id ?? "",
    //     client: findField(fields, "clientSelect").selected_option.value,
    //     producerDeadline: findField(fields, "producerDeadline").selected_date,
    //     clientDeadline: findField(fields, "clientDeadline").selected_date,
    //     media: findField(fields, "mediaSelect")
    //         .selected_options.map((m) => m.value)
    //         .join(", "),
    //     dropboxLink: findField(fields, "dropboxLink").value,
    //     notes: findField(fields, "notes").value,
    //     projectCode: findField(fields, "projectCode").value,
    // };

    const projectTitle = await generateTitleFromRequest(
        findField(fields, "clientSelect").selected_option.value,
        findField(fields, "notes").value
    );

    //Get the project code from the dropdown
    const projectCode = findField(fields, "project_select").value;

    console.log("Project Code:", projectCode);

    //Studio's Project Column ID
    const studioProjectColumnId = "board_relation_mkxsg758";

    const newTask = {
        name: projectTitle,

        Producer: mondayUser.id ?? "",
        "Project Code": projectCode,
        Client: findField(fields, "clientSelect").selected_option.value,

        "Client Deadline": findField(fields, "clientDeadline").selected_date,
        "Producer Deadline": findField(fields, "producerDeadline")
            .selected_date,

        Media: findField(fields, "mediaSelect")
            .selected_options.map((m) => m.value)
            .join(", "),
        Dropbox: {
            url: findField(fields, "dropboxLink").value,
            text: "Link",
        },
        Details: findField(fields, "notes").value,
    };

    console.log("New Task:", newTask);


    // Add task to boards
    const results = locations.map(async ({ boardId, slackChannel }) => {
            console.log("Before adding to board:", boardId, slackChannel);

        const result = await addTaskToBoardWithColumns(newTask, boardId);



        console.log("Task added to board:", result);

        //1. Get all the tasks from Ops board 
        const rows = await getAllTaskRowsFromBoard(
            process.env.OPS_MONDAY_BOARD
        );

        //2.Match the project code to get the project ID
        const matchedProject = rows.find(
            (row) => row.projectCode === projectCode
        );

        if (!matchedProject) {
            console.error(
                `No matching project found in Ops board for project code: ${projectCode}`
            );
            return result;
        }

        const opsProjectId = matchedProject.id;

        //Link the task to project
        const linkResult = await linkTaskToProject(
            result.data.create_item.id,
            opsProjectId,
            process.env.STUDIO_MONDAY_BOARD
        );

        console.log("Link result:", linkResult);





        let newRequestMessageTemplate = _.cloneDeep(
            templates.newRequestMessage
        );

        newRequestMessageTemplate.blocks[0].text.text = `*<@${payload.user.id}>* submitted a new request: ${projectTitle}`;
        newRequestMessageTemplate.blocks[1].fields[0].text += newTask.Client;
        newRequestMessageTemplate.blocks[1].fields[1].text += newTask.Media;
        newRequestMessageTemplate.blocks[2].fields[0].text +=
            newTask["Producer Deadline"];
        newRequestMessageTemplate.blocks[2].fields[1].text +=
            newTask["Client Deadline"];
        newRequestMessageTemplate.blocks[3].fields[0].text += newTask.Details;
        newRequestMessageTemplate.blocks[3].fields[1].text +=
            newTask["Project Code"];
        newRequestMessageTemplate.blocks[4].elements[0].value = JSON.stringify({
            boardId,
            taskTitle: projectTitle,

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
            await reportErrorToSlack(
                error,
                "Add Task to Board - handleRequestResponse"
            );

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

const handleSpendRequestResponse = async (payload) =>
    handleSpendRequest(payload, [
        {
            boardId: process.env.SPEND_MONDAY_BOARD,
            slackChannel: process.env.SPEND_SLACK_CHANNEL,
        },
    ]);

const handleCustomerComplaintResponse = async (payload) =>
    handleCustomerComplaint(payload, [{}]);

const handleOpportunityToImproveResponse = async (payload) =>
    handleOpportunityToImprove(payload, [
        {
            slackChannel: process.env.CUSTOMER_COMPLAINT_SLACK_CHANNEL,
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
        await reportErrorToSlack(error, "handleInvoiceRequestResponse");
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
    newOpsRequestMessageTemplate.blocks[0].text.text = `*@${consultantSlackUser.name}*'s proposal was moved to "${payload.stageName}":`;
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

    newOpsRequestMessageTemplate.blocks[2].elements[1].url =
        process.env.COPPER_OPPORTUNITY_URL + selectedOpportunity.id;

    try {
        // Send message to users
        const message = await slack.chat.postMessage({
            channel: process.env.OPS_SLACK_CHANNEL,
            text: `A proposal was moved to "${payload.stageName}": ${selectedOpportunity.name} `,

            ...newOpsRequestMessageTemplate,
        });

        console.log(
            "Message sent to Ops Slack channel",
            message.message.blocks[0]
        );

        await slack.chat.postMessage({
            channel: process.env.OPS_SLACK_CHANNEL,
            thread_ts: message.ts,
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*<@${consultantSlackUser.id}>* please state here if there are any actions required for this task.`,
                    },
                },
                {
                    type: "actions",
                    elements: [
                        {
                            type: "button",
                            text: {
                                type: "plain_text",
                                text: "No Action Required",
                                emoji: true,
                            },

                            value: JSON.stringify({
                                parentMessageTs: message.ts,
                                parentChannelId: message.channel,
                            }),
                            action_id: "noActionRequired",
                            style: "danger",
                        },
                    ],
                },
            ],
        });
    } catch (error) {
        await reportErrorToSlack(error, "handleOpsRequestResponse");
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
        "Start Go-Live Date": fieldValues.find((f) =>
            f.hasOwnProperty("goStartLiveDateInput")
        ).goStartLiveDateInput.selected_date,
        "End Go-Live Date": fieldValues.find((f) =>
            f.hasOwnProperty("goEndLiveDateInput")
        ).goEndLiveDateInput.selected_date,

        Description: fieldValues.find((f) =>
            f.hasOwnProperty("projectDescriptionInput")
        ).projectDescriptionInput.value,
        "Dropbox Link":
            fieldValues.find((f) => f.hasOwnProperty("dropboxLinkInput"))
                .dropboxLinkInput.value + " Link",
        Channel: fieldValues.find((f) => f.hasOwnProperty("channelSelect"))
            .channelSelect.selected_option.value,
        "Go-Live Date": {
            from: fieldValues.find((f) =>
                f.hasOwnProperty("goStartLiveDateInput")
            ).goStartLiveDateInput.selected_date,
            to: fieldValues.find((f) => f.hasOwnProperty("goEndLiveDateInput"))
                .goEndLiveDateInput.selected_date,
        },
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
    newMarketingRequestMessageTemplate.blocks[2].fields[0].text +=
        newTask.Description;
    newMarketingRequestMessageTemplate.blocks[3].fields[0].text +=
        newTask["Review Date"];
    newMarketingRequestMessageTemplate.blocks[2].fields[1].text +=
        newTask["Start Go-Live Date"];
    newMarketingRequestMessageTemplate.blocks[3].fields[1].text +=
        newTask["End Go-Live Date"];
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
        await reportErrorToSlack(error, "handleMarketingRequestResponse");
        console.log(error);
    }
};

//No action required
/*
  * This function is called when the "No Action Required" button is clicked
  1. Parses the payload to get the parent message timestamp and channel ID
  2. Looks for the parent message in the channel history
  3. Updates the parent message by removing the actions block and adding a confirmation message
  4. Updates the current message to remove the "No Action Required" button and add a confirmation message
 */
const noActionRequired = async (payload) => {
    console.log("No action required payload", payload);

    //Parse parent payload
    const { parentMessageTs, parentChannelId } = JSON.parse(
        payload.actions[0].value
    );

    //Look parent history
    const parentBlock = await slack.conversations.history({
        channel: parentChannelId,
        latest: parentMessageTs,
        limit: 1,
        inclusive: true,
    });

    //Get the parent message and its blocks
    const parentMessage = parentBlock.messages[0];
    const parentBlocks = [...parentMessage.blocks];

    //Look for all the actions blocks in the parent message
    //FindIndex returns -1 for no match
    const actionsBlockIndex = parentBlocks.findIndex(
        (block) => block.type === "actions"
    );

    //Check if a block with type "actions" exists, if yes filter to find the "viewOnCopper" button
    if (actionsBlockIndex !== -1) {
        parentBlocks[actionsBlockIndex].elements = parentBlocks[
            actionsBlockIndex
        ].elements.filter((element) => element.action_id === "viewOnCopper");
    }

    // Add the confirmation message block to the parent blocks
    parentBlocks.push({
        type: "section",
        text: {
            type: "mrkdwn",
            text: `*<@${payload.user.id}>* marked this task as no action required`,
        },
    });

    // Update the parent message
    await slack.chat.update({
        channel: parentChannelId,
        ts: parentMessageTs,
        blocks: parentBlocks,
    });

    // Now update the threads message
    // Get the threads message blocks
    const threadBlocks = [...payload.message.blocks];

    //Find if there is an actions block in the threads message
    const threadActionsBlockIndex = threadBlocks.findIndex(
        (block) => block.type === "actions"
    );

    //If there is an actions block, remove the "No Action Required" button
    if (threadActionsBlockIndex !== -1) {
        threadBlocks.splice(threadActionsBlockIndex, 1);
    }

    // Add a confirmation message block to the thread blocks
    threadBlocks.push({
        type: "section",
        text: {
            type: "mrkdwn",
            text: `*<@${payload.user.id}>* confirmed this proposal requires no additional action.`,
        },
    });

    try {
        // Update the message
        const message = await slack.chat.update({
            channel: payload.channel.id,
            ts: payload.message.ts,
            blocks: threadBlocks,
        });
    } catch (error) {
        await reportErrorToSlack(error, "noActionRequired");
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
 * Function to approve the spend request action
 */

const approveSpendRequest = async (payload) => {
    console.log("Payload inside approveSpendRequest", payload);

    try {
        //Parse the request data from the payload
        const parseButtonData = JSON.parse(payload.actions[0].value);
        console.log("Parsed request data:", parseButtonData);

        //Get the slack details of the user that approved the request
        const user = await getUserById(payload.user.id);

        //Check if the user id who approved the request is in the list of approvers
        const isApprover = process.env.SPEND_REQUEST_APPROVERS.split(
            ","
        ).includes(user.id);
        if (!isApprover) {
            console.log("User is not an approver");
            return {
                status: "error",
                message: "User is not authorized to approve this request.",
            };
        }

        console.log("User that approved the request", user);
        console.log("Blocks before update", payload.message.blocks[5]);

        //Get a modal template to justify the decline
        const approveModal = _.cloneDeep(templates.approveSpendRequestModal);

        //Send the original payload to the modal
        const modalPayload = {
            originalRequestData: parseButtonData,
            channelId: payload.channel.id,
            messageTs: payload.message.ts,
            acceptedIdBy: user.id,
            acceptedNameBy: user.profile.real_name,
        };

        //Set the metadata for the modal
        approveModal.private_metadata = JSON.stringify(modalPayload);

        // Show the modal
        await slack.views.open({
            trigger_id: payload.trigger_id,
            view: approveModal,
        });

        console.log("Approval modal opened successfully");

        return {
            status: "success",
            message: "Approval modal opened.",
        };
    } catch (error) {
        await reportErrorToSlack(error, "approveSpendRequest");

        console.error("Error opening approval modal:", error);
        return {
            status: "error",
            message: "Failed to open approval modal.",
        };
    }
};

//Function to handle when the user clicks accept for spend request and opens a modal
const handleAcceptSpendRequestModal = async (payload) => {
    const { addSpendRequestToGoogleSheets } = require("../helpers/helpers.js");

    console.log("Processing accept modal submission", payload);

    try {
        //Get the text field value from the modal submission
        const stateValues = payload.view.state.values;

        console.log("State values:", stateValues);

        //Get the block id that has the text field and get its value
        const blockId = Object.keys(stateValues)[0];
        const textfieldValue = stateValues[blockId].acceptanceReasonInput.value;

        // Get original request data from private_metadata by parsing
        const modalMetadata = JSON.parse(payload.view.private_metadata);

        console.log("Modal metadata:", modalMetadata);

        //Break down the metadata
        const {
            originalRequestData,
            channelId,
            messageTs,
            acceptedIdBy,
            acceptedNameBy,
        } = modalMetadata;

        console.log("Accept reason:", textfieldValue);
        console.log("Accepting request for:", originalRequestData);

        // Get the original message to preserve request details
        const messageHistory = await slack.conversations.history({
            channel: channelId,
            latest: messageTs,
            limit: 1,
            inclusive: true,
        });

        //Retrive the orignal block from the message history
        const originalBlocks = messageHistory.messages[0].blocks;

        //Remove the action buttons from the original blocks
        //Add a new section block with the user that declined the request
        const updatedBlocks = [
            ...originalBlocks.slice(0, 5),
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*<@${acceptedIdBy}>* Accepted this spend request.\n*Reason:* ${textfieldValue}`,
                },
            },
        ];

        //Send notification to the requester that their spend request was approved
        await slack.chat.postMessage({
            channel: originalRequestData.userId,
            text: `:tada: Your spend request for *${originalRequestData.spendType}* has been *approved* by *<@${acceptedIdBy}>*.`,
        });

        // Update the original message - this removes the approve/deny buttons and adds decline buttons
        await slack.chat.update({
            channel: channelId,
            ts: messageTs,
            blocks: updatedBlocks,
        });

        //Add the textField from the modal to the original payload
        const payloadWithReason = {
            ...originalRequestData,
            textfieldValue,
        };
        console.log("Payload with reason:", payloadWithReason);

        // Add to Google Sheets
        console.log("Adding accepted spend request to Google Sheets");
        const addToGoogleSheets = await addSpendRequestToGoogleSheets(
            payloadWithReason,
            acceptedIdBy,
            acceptedNameBy
        );

        if (addToGoogleSheets && addToGoogleSheets.success) {
            console.log(
                "Successfully added to Google Sheets:",
                addToGoogleSheets
            );
        } else {
            console.error("Failed to add to Google Sheets:", addToGoogleSheets);
            return {
                status: "error",
                message: "Failed to add declined request to Google Sheets.",
            };
        }

        return {
            status: "success",
            message: "Spend request was declined.",
        };
    } catch (error) {
        await reportErrorToSlack(error, "handleAcceptSpendRequestModal");
        console.error("Error processing denial:", error);
        return {
            status: "error",
            message: "Failed to process denial.",
            error: error.message,
        };
    }
};

/**
 * Function to decline the spend request action
 */
const denySpendRequest = async (payload) => {
    console.log("Payload inside denySpendRequest", payload);

    try {
        // Parse the request data from the payload
        const parseButtonData = JSON.parse(payload.actions[0].value);
        console.log("Request data:", parseButtonData);

        //Get the slack details of the user that declined the request
        const user = await getUserById(payload.user.id);

        console.log("User that denied the request", user);

        //Check if the user id who approved the request is in the list of approvers
        const isApprover = process.env.SPEND_REQUEST_APPROVERS.split(
            ","
        ).includes(user.id);
        if (!isApprover) {
            console.log("User is not an approver");
            return {
                status: "error",
                message: "User is not authorized to approve this request.",
            };
        }

        //Get a modal template to justify the decline
        const denyModal = _.cloneDeep(templates.denySpendRequestModal);

        //Send the original payload to the modal
        const modalPayload = {
            originalRequestData: parseButtonData,
            channelId: payload.channel.id,
            messageTs: payload.message.ts,
            deniedIdBy: user.id,
            deniedNameBy: user.profile.real_name,
        };

        //Set the metadata for the modal
        denyModal.private_metadata = JSON.stringify(modalPayload);

        // Show the modal
        await slack.views.open({
            trigger_id: payload.trigger_id,
            view: denyModal,
        });

        console.log("Denial modal opened successfully");

        return {
            status: "success",
            message: "Denial modal opened.",
        };
    } catch (error) {
        await reportErrorToSlack(error, "denySpendRequest");
        console.error("Error opening denial modal:", error);
        return {
            status: "error",
            message: "Failed to open denial modal.",
        };
    }
};

//Function to handle when the user clicks decline for spend request and opens a modal
const handleDenySpendRequestModal = async (payload) => {
    const { addSpendRequestToGoogleSheets } = require("../helpers/helpers.js");

    console.log("Processing deny modal submission", payload);

    try {
        //Get the text field value from the modal submission
        const stateValues = payload.view.state.values;

        console.log("State values:", stateValues);

        //Get the block id that has the text field and get its value
        const blockId = Object.keys(stateValues)[0];
        const textfieldValue = stateValues[blockId].denialReasonInput.value;

        // Get original request data from private_metadata by parsing
        const modalMetadata = JSON.parse(payload.view.private_metadata);

        console.log("Modal metadata:", modalMetadata);

        //Break down the metadata
        const {
            originalRequestData,
            channelId,
            messageTs,
            deniedIdBy,
            deniedNameBy,
        } = modalMetadata;

        console.log("Denial reason:", textfieldValue);
        console.log("Denying request for:", originalRequestData);

        // Get the original message to preserve request details
        const messageHistory = await slack.conversations.history({
            channel: channelId,
            latest: messageTs,
            limit: 1,
            inclusive: true,
        });

        //Retrive the orignal block from the message history
        const originalBlocks = messageHistory.messages[0].blocks;

        //Remove the action buttons from the original blocks
        //Add a new section block with the user that declined the request
        const updatedBlocks = [
            ...originalBlocks.slice(0, 5),
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*<@${deniedIdBy}>* declined this spend request.\n*Reason:* ${textfieldValue}`,
                },
            },
        ];

        // Update the original message - this removes the approve/deny buttons and adds decline buttons
        await slack.chat.update({
            channel: channelId,
            ts: messageTs,
            blocks: updatedBlocks,
        });

        //Add the textField from the modal to the original payload
        const payloadWithReason = {
            ...originalRequestData,
            textfieldValue,
        };
        console.log("Payload with reason:", payloadWithReason);

        // Add to Google Sheets
        console.log("Adding declined spend request to Google Sheets");
        const addToGoogleSheets = await addSpendRequestToGoogleSheets(
            payloadWithReason,
            deniedIdBy,
            deniedNameBy
        );

        if (addToGoogleSheets && addToGoogleSheets.success) {
            console.log(
                "Successfully added to Google Sheets:",
                addToGoogleSheets
            );
        } else {
            console.error("Failed to add to Google Sheets:", addToGoogleSheets);
            return {
                status: "error",
                message: "Failed to add declined request to Google Sheets.",
            };
        }

        //Send notification to the requester that their spend request was denied
        await slack.chat.postMessage({
            channel: originalRequestData.userId,
            text: `Your spend request for *${originalRequestData.spendType}* has been *denied* by *<@${deniedIdBy}>*.`,
        });

        return {
            status: "success",
            message: "Spend request was declined.",
        };
    } catch (error) {
        await reportErrorToSlack(error, "handleDenySpendRequestModal");
        console.error("Error processing denial:", error);
        return {
            status: "error",
            message: "Failed to process denial.",
            error: error.message,
        };
    }
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
        await reportErrorToSlack(error, "createTask");

        console.log(error);
    }
};

/**
 * Claim task as user
 */
const claimTask = async (payload) => {
    // Get the user
    const user = await getUserById(payload.user.id);

    console.log("Claim Task payload", payload);

    // Get the Monday user
    const mondayUser = await getMondayUserByEmail(user.profile.email);

    // Find the actions block location
    const actionsBlockIndex = payload.message.blocks.findIndex(
        (block) => block.type === "actions"
    );

    const taskAddress =
        payload.message.blocks[actionsBlockIndex].elements[1].url;

    const { boardId, itemId, taskTitle } = JSON.parse(payload.actions[0].value);

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
        text: `*<@${claimer}>* claimed your <${taskAddress}| ${taskTitle} task>.`,
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
        await reportErrorToSlack(error, "claimTask");
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
        await reportErrorToSlack(error, "openOpsRequestForm");
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
        await reportErrorToSlack(error, "openMarketingRequestForm");
        console.dir(error, { depth: null });
    }
};

//Function to open the spend request form with a custom template
const openSpendRequestFormWithTemplate = async (payload, callbackName) => {
    console.log("Payload inside ", payload);
    console.log("Callback name inside ", callbackName);

    // Get the modal template
    const requestModal = _.cloneDeep(templates.spendRequestModal);

    requestModal.callback_id =
        callbackName || "handleMultipleTeamsRequestResponse";

    try {
        // Send spend request form to Slack
        const result = await slack.views.open({
            trigger_id: payload.trigger_id,
            view: requestModal,
        });
    } catch (error) {
        await reportErrorToSlack(error, "openSpendRequestFormWithTemplate");
        console.log(error);
    }
};

//Function to open form with custom template
const openFormWithCustomTemplate = async (payload, callbackName, template) => {
    // console.log("Payload inside openFormWithCustomTemplate", payload);
    // console.log("Callback name inside openFormWithCustomTemplate", callbackName);
    // console.log("template:", template)

    // Get the modal template
    const requestModal = _.cloneDeep(template);

    requestModal.callback_id =
        callbackName || "handleMultipleTeamsRequestResponse";

    try {
        // Send spend request form to Slack
        const result = await slack.views.open({
            trigger_id: payload.trigger_id,
            view: requestModal,
        });
    } catch (error) {
        await reportErrorToSlack(error, "openFormWithCustomTemplate");
        console.log(error);
    }
};

/**
 * Find application by name or alternative command
 * @param {string} searchTerm - The search term (app name or command alias)
 * @param {object} passwords - The passwords object
 * @returns {object|null} - {appKey, credentials} or null if not found
 */
const findApplicationByCommand = (searchTerm, passwords) => {
    const lowerSearchTerm = searchTerm.toLowerCase().trim();

    // First, try direct match by app name
    if (passwords[lowerSearchTerm]) {
        return {
            appKey: lowerSearchTerm,
            credentials: passwords[lowerSearchTerm],
        };
    }

    // Then, search through alternative commands
    for (const [appKey, credentials] of Object.entries(passwords)) {
        if (
            typeof credentials === "object" &&
            credentials.commands &&
            Array.isArray(credentials.commands)
        ) {
            // Check if the search term matches any of the alternative commands
            const matchingCommand = credentials.commands.find(
                (cmd) => cmd.toLowerCase() === lowerSearchTerm
            );
            if (matchingCommand) {
                return { appKey, credentials };
            }
        }
    }

    return null;
};

/**
 * Log password request to passwords channel
 * @param {string} userId - The Slack user ID who made the request
 * @param {string} appName - The application name that was requested
 * @param {boolean} success - Whether the request was successful
 */
const logPasswordRequest = async (userId, appName, success) => {
    const passwordsChannel = process.env.PASSWORDS_CHANNEL;

    if (!passwordsChannel) {
        console.log(
            "PASSWORDS_CHANNEL not configured, skipping password request logging"
        );
        return;
    }

    const timestamp = new Date().toLocaleString("en-GB", {
        timeZone: "Europe/London",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const status = success ? "✅ SUCCESS" : "❌ FAILED";
    const emoji = success ? "🔐" : "⚠️";

    const logMessage =
        `${emoji} *Password Request Log*\n` +
        `*User:* <@${userId}>\n` +
        `*Application:* \`${appName}\`\n` +
        `*Status:* ${status}\n` +
        `*Time:* ${timestamp}`;

    try {
        await slack.chat.postMessage({
            channel: passwordsChannel,
            text: logMessage,
        });
    } catch (error) {
        await reportErrorToSlack(error, "logPasswordRequest");
        console.error("Failed to log password request:", error);
    }
};

/**
 * Handle password slash command
 * Responds with a temporary password for the requested application
 */
const handlePasswordCommand = async (payload) => {
    const { loadPasswords } = require("../helpers/passwordLoader");
    const passwords = loadPasswords();

    // Extract the application name from the command text
    const appName = payload.text ? payload.text.trim().toLowerCase() : "";

    if (!appName) {
        // If no application specified, show available applications
        const availableApps = Object.keys(passwords).join(", ");

        await slack.chat.postEphemeral({
            channel: payload.channel_id,
            user: payload.user_id,
            text: `Please specify an application name. Available applications: ${availableApps}\n\nUsage: \`/password <application-name>\``,
        });

        // Log password request with no app name
        await logPasswordRequest(payload.user_id, "(no app specified)", false);
        return;
    }

    // Find the application by name or alternative command
    const foundApp = findApplicationByCommand(appName, passwords);

    if (foundApp) {
        const { appKey, credentials } = foundApp;

        // Handle both new format (object with username/password) and legacy format (string)
        let message;
        if (
            typeof credentials === "object" &&
            credentials.username &&
            credentials.password
        ) {
            message = `🔐 Credentials for *${appKey}*:\n\n👤 *Username:* \`${credentials.username}\`\n🔑 *Password:* \`${credentials.password}\``;

            // Add URL if available
            if (credentials.url) {
                message += `\n🔗 *URL:* ${credentials.url}`;
            }

            message += `\n\n_This message is only visible to you and will disappear when you refresh._`;
        } else {
            // Legacy format - just a password string
            message = `🔐 Password for *${appKey}*: \`${credentials}\`\n\n_This message is only visible to you and will disappear when you refresh._`;
        }

        // Send the credentials as an ephemeral message (only visible to the user)
        await slack.chat.postEphemeral({
            channel: payload.channel_id,
            user: payload.user_id,
            text: message,
        });

        // Log successful password request
        await logPasswordRequest(payload.user_id, appKey, true);
    } else {
        // Application not found - show available apps and alternative commands
        const availableApps = Object.keys(passwords);
        const allCommands = [];

        // Collect all possible commands (app names + alternative commands)
        availableApps.forEach((appKey) => {
            allCommands.push(appKey);
            const credentials = passwords[appKey];
            if (
                typeof credentials === "object" &&
                credentials.commands &&
                Array.isArray(credentials.commands)
            ) {
                allCommands.push(...credentials.commands);
            }
        });

        const uniqueCommands = [...new Set(allCommands)].sort();
        const commandList = uniqueCommands.slice(0, 20).join(", "); // Limit to first 20 to avoid message being too long
        const remainingCount = uniqueCommands.length - 20;

        let errorMessage = `❌ Application or command "${appName}" not found.\n\n📋 Available commands: ${commandList}`;

        if (remainingCount > 0) {
            errorMessage += `\n\n... and ${remainingCount} more. Use \`/passwords\` to see all applications.`;
        }

        await slack.chat.postEphemeral({
            channel: payload.channel_id,
            user: payload.user_id,
            text: errorMessage,
        });

        // Log failed password request
        await logPasswordRequest(payload.user_id, appName, false);
    }
};

/**
 * Handle passwords list command
 * Shows all available applications without revealing actual passwords
 */
/**
 * Handle passwords list command
 * Shows all available applications without revealing actual passwords
 */
const handlePasswordsListCommand = async (payload) => {
    const { loadPasswords } = require("../helpers/passwordLoader");
    const passwords = loadPasswords();

    // Get all application names
    const applicationNames = Object.keys(passwords);

    if (applicationNames.length === 0) {
        await slack.chat.postEphemeral({
            channel: payload.channel_id,
            user: payload.user_id,
            text: `📋 No applications configured in the password manager.`,
        });

        // Log passwords list request (empty)
        await logPasswordRequest(
            payload.user_id,
            "passwords list (empty)",
            true
        );
        return;
    }

    // Format the list nicely with alternative commands
    const formattedList = applicationNames
        .sort() // Sort alphabetically for better UX
        .map((app) => {
            const credentials = passwords[app];
            let line = `• ${app}`;

            // Add alternative commands if available
            if (
                typeof credentials === "object" &&
                credentials.commands &&
                Array.isArray(credentials.commands)
            ) {
                const altCommands = credentials.commands
                    .map((cmd) => `\`${cmd}\``)
                    .join(", ");
                line += ` (also: ${altCommands})`;
            }

            return line;
        })
        .join("\n");

    await slack.chat.postEphemeral({
        channel: payload.channel_id,
        user: payload.user_id,
        text: `📋 *Available Applications:*\n\n${formattedList}\n\n💡 Use \`/password <application-name>\` to get a specific password.\n\n_This message is only visible to you._`,
    });

    // Log passwords list request
    await logPasswordRequest(payload.user_id, "passwords list", true);
};

const reportErrorToSlack = async (error, context) => {
    const errorChannel = process.env.ERROR_REPORTING_CHANNEL;

    if (!errorChannel) {
        console.log(
            "ERROR_REPORTING_CHANNEL not configured, skipping error reporting"
        );
        return;
    }

    const timestamp = new Date().toLocaleString("en-GB", {
        timeZone: "Europe/London",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const logMessage =
        `❗ *Error Report*\n` +
        `*Context:* ${context}\n` +
        `*Error Message:* ${error.message}\n` +
        `*Stack Trace:* \`\`\`${error.stack}\`\`\`\n` +
        `*Time:* ${timestamp}`;

    try {
        await slack.chat.postMessage({
            channel: errorChannel,
            text: logMessage,
        });
    } catch (err) {
        console.error("Failed to report error to Slack:", err);
    }
};

module.exports = {
    slack,
    getMembers,
    getMemberById,
    openStudioRequestForm,
    openCommTechRequestForm,
    openSpendRequestForm,
    openCustomerComplaintForm,
    openOpportunityToImproveForm,
    openOpsRequestForm,
    openMultipleTeamsRequestForm,
    openInvoiceRequestForm,
    openMarketingRequestForm,
    handleStudioRequestResponse,
    handleCommTechRequestResponse,
    handleSpendRequestResponse,
    handleCustomerComplaintResponse,
    handleOpportunityToImproveResponse,
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
    handleRequestResponse,
    denySpendRequest,
    approveSpendRequest,
    handleSpendRequest,
    handleCustomerComplaint,
    handleOpportunityToImprove,
    handleDenySpendRequestModal,
    handleAcceptSpendRequestModal,
    handlePasswordCommand,
    handlePasswordsListCommand,
    reportErrorToSlack,
};
