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
    handleMultipleTeamsRequestResponse,
    handleInvoiceRequestResponse,
    handleOpsRequestResponse,
    handleMarketingRequestResponse,
    claimTask,
    markAsDone,
    approveSpendRequest,
    denySpendRequest,
    noActionRequired,
    getOpportunityOptions,
    handleDenySpendRequestModal,
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
    handleCommTechRequestResponse: (payload) => {
        handleCommTechRequestResponse(payload);
    },
    handleSpendRequestResponse: (payload) => {
        handleSpendRequestResponse(payload);
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
    markAsDone: (payload) => {
        markAsDone(payload);
    },
    noActionRequired: (payload) => {
        noActionRequired(payload);
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

    try {
        if (payload.type === "block_actions") {
            // Call the appropriate action handler
            await actions[payload.actions[0].action_id](payload);
        }

        if (payload.type === "view_submission") {
            // Call the appropriate action handler
            await actions[payload.view.callback_id](payload);
        }

        if (payload.type === "block_suggestion") {
            const suggestions = await actions[payload.action_id](payload);

            res.json(suggestions);

            return;
        }
    } catch {
        // Dump action to console
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
    handleCopperUpdateOpportunityWebhook,
} = require("../../controllers/copper");

const copperActions = {
    opportunity: {
        update: async (payload) => {
            console.dir(payload, { depth: null });

            await handleCopperUpdateOpportunityWebhook(payload);
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
