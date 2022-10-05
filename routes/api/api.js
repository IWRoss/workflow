const express = require("express"),
  router = express.Router();

const {
  openDesignRequestForm,
  handleDesignRequestResponse,
  claimTask,
} = require("../../controllers/slack");

/**
 * To keep our route closure nice and clean, we'll define all our interactions
 * with the Slack controller here.
 */
const actions = {
  openDesignRequestForm: (payload) => {
    openDesignRequestForm(payload);
  },
  request: (payload) => {
    openDesignRequestForm(payload);
  },
  handleDesignRequestResponse: (payload) => {
    handleDesignRequestResponse(payload);
  },
  claimTask: (payload) => {
    claimTask(payload);
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
  } catch {
    // Dump action to console
    console.log(payload);
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

module.exports = router;
