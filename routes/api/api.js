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
} = require("../../controllers/slack");

const {
    getOpportunities,
    getOpportunity,
    getCompanies,
    getCopperUsers,
    getWonOpportunities,
} = require("../../controllers/copper");

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


// Copper GET routes 

router.get("/copper/opportunities", async (req, res) => {
    try {
        const opportunities = await getOpportunities();
        res.json(opportunities);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch opportunities" });
    }
});

router.get("/copper/opportunities/won", async (req, res) => {
    try {
        const opportunities = await getWonOpportunities();
        res.json(opportunities);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch won opportunities" });
    }
});

router.get("/copper/opportunities/:id", async (req, res) => {
    try {
        const opportunity = await getOpportunity(req.params.id);
        res.json(opportunity);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch opportunity" });
    }
});

router.get("/copper/companies", async (req, res) => {
    try {
        const companies = await getCompanies();
        res.json(companies);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch companies" });
    }
});

router.get("/copper/users", async (req, res) => {
    try {
        const users = await getCopperUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

module.exports = router;
