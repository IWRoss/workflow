const express = require("express"),
    router = express.Router();

const {
    openStudioRequestForm,
    openCommTechRequestForm,
    openSpendRequestForm,
    openMultipleTeamsRequestForm,
    openInvoiceRequestForm,
    openOpsRequestForm,
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
    claimTask,
    createTask,
    approveSpendRequest,
    denySpendRequest,
    noActionRequired,
    getOpportunityOptions,
    handleDenySpendRequestModal,
    handleAcceptSpendRequestModal,
    openCustomerComplaintForm,
    openOpportunityToImproveForm,
    handlePasswordCommand,
    handlePasswordsListCommand,
    handleProjectSelectOptions,
} = require("../../controllers/slack");

/**
 * To keep our route closure nice and clean, we'll define all our interactions
 * with the Slack controller here.
 */
const actions = {
    openStudioRequestForm: (payload) => {
        openStudioRequestForm(payload);
    },
    openCommTechRequestForm: (payload) => {
        openCommTechRequestForm(payload);
    },
    openSpendRequestForm: (payload) => {
        openSpendRequestForm(payload);
    },
    openCustomerComplaintForm: (payload) => {
        openCustomerComplaintForm(payload);
    },
    openOpportunityToImproveForm: (payload) => {
        openOpportunityToImproveForm(payload);
    },
    approveSpendRequest: (payload) => {
        approveSpendRequest(payload);
    },
    denySpendRequest: (payload) => {
        denySpendRequest(payload);
    },
    openStudioRequestForm: (payload) => {
        openStudioRequestForm(payload);
    },
    openMultipleTeamsRequestForm: (payload) => {
        openMultipleTeamsRequestForm(payload);
    },
    openInvoiceRequestForm: (payload) => {
        openInvoiceRequestForm(payload);
    },
    openOpsRequestForm: (payload) => {
        openOpsRequestForm(payload);
    },
    openMarketingRequestForm: (payload) => {
        openMarketingRequestForm(payload);
    },
    handleDenySpendRequestModal: (payload) => {
        handleDenySpendRequestModal(payload);
    },
    handleAcceptSpendRequestModal: (payload) => {
        handleAcceptSpendRequestModal(payload);
    },
    handleCommTechRequestResponse: (payload) => {
        handleCommTechRequestResponse(payload);
    },
    handleSpendRequestResponse: (payload) => {
        handleSpendRequestResponse(payload);
    },
    handleCustomerComplaintResponse: (payload) => {
        handleCustomerComplaintResponse(payload);
    },
    handleOpportunityToImproveResponse: (payload) => {
        handleOpportunityToImproveResponse(payload);
    },

    handleStudioRequestResponse: (payload) => {
        handleStudioRequestResponse(payload);
    },
    handleMultipleTeamsRequestResponse: (payload) => {
        handleMultipleTeamsRequestResponse(payload);
    },
    handleInvoiceRequestResponse: (payload) => {
        handleInvoiceRequestResponse(payload);
    },
    handleOpsRequestResponse: (payload) => {
        handleOpsRequestResponse(payload);
    },
    handleMarketingRequestResponse: (payload) => {
        handleMarketingRequestResponse(payload);
    },
    claimTask: (payload) => {
        claimTask(payload);
    },
    getOpportunityOptions: async (payload) => {
        return await getOpportunityOptions(payload);
    },
    createTask: (payload) => {
        createTask(payload);
    },
    noActionRequired: (payload) => {
        noActionRequired(payload);
    },
    password: (payload) => {
        handlePasswordCommand(payload);
    },
    passwords: (payload) => {
        handlePasswordsListCommand(payload);
    },
};

/**
 * POST /api/slack
 *
 * This route is used to handle all Slack actions.
 */
router.post("/slack/receive", async (req, res) => {
    // Parse the request payload
    const payload = JSON.parse(req.body.payload);

    console.log("=== Slack Request Received ===");
    console.log("Payload type:", payload.type);
    console.log("Action ID:", payload.action_id);

    try {
        //Check if the actions are button clicks or static select
        if (payload.type === "block_actions") {
            // Call the appropriate action handler
            await actions[payload.actions[0].action_id](payload);
        }


        //Check if the actions are modal submissions
        if (payload.type === "view_submission") {
            // Call the appropriate action handler
            await actions[payload.view.callback_id](payload);
        }

        //Check if the actions are block suggestions (for external select)
        if (payload.type === "block_suggestion") {
            console.log("Full payload:", JSON.stringify(payload, null, 2));
            
            // Handle external select options loading
            if (payload.action_id === "project_select") {
                console.log("Project select detected, calling handleProjectSelectOptions");
                const options = await handleProjectSelectOptions(payload);
                console.log("Options returned:", JSON.stringify(options, null, 2));
                return res.json(options);
            }
            
            // Try to use the actions object for other block_suggestion types
            if (actions[payload.action_id]) {
                const suggestions = await actions[payload.action_id](payload);
                return res.json(suggestions);
            }
            
            // Fallback for unknown block_suggestion types
            console.log("No matching action, returning empty options");
            return res.json({ options: [] });
        }
    } catch (error) {
        // Dump action to console
        console.error("Error in /slack/receive:", error);
        console.dir(payload, { depth: null });
    }

    res.send();
});

/**
 *
 */
router.post("/slack/command", async (req, res) => {
    const command = req.body.command.replace("/", "");

    const payload = req.body;

    try {
        await actions[command](payload);
    } catch {
        // Dump action to console
        console.log(payload);
    }

    res.send();
});

const {
    addOpportunityToProjectBoardOnWebhook,
    moveOpportunityToCompletedGroupOnWebhook,
} = require("../../controllers/copper");

const copperActions = {
    opportunity: {
        update: async (payload) => {
            console.dir(payload, { depth: null });

            await Promise.all([
                addOpportunityToProjectBoardOnWebhook(payload),
                moveOpportunityToCompletedGroupOnWebhook(payload),
            ]);

            return true;
        },
    },
};

/**
 * Copper endpoint
 */
router.post("/copper/receive", async (req, res) => {
    const payload = req.body;

    try {
        // console.dir(payload, { depth: null });
        await copperActions[payload.type][payload.event](payload);
    } catch {
        // Dump action to console
        console.dir(payload, { depth: null });
    }

    res.send();
});


module.exports = router;
