const assert = require("assert");
const dotenv = require("dotenv");
beforeEach(() => {
  dotenv.config();
});
describe("#handleCopperUpdatesToProposalSubmittedWebHook", function () {
  it("should create a ticket on slack when staged moved to submitted", async function () {
    const {
      handleCopperUpdateOpportunityWebhook,
    } = require("../controllers/copper");
    // Increase timeout to 10 seconds
    this.timeout(10000);
    payload = {
      subscription_id: 460389,
      event: "update",
      type: "opportunity",
      ids: [34678548],
      updated_attributes: {
        stage_id: [351547, 351548],
        win_probability: [10, 50],
        last_stage_at: ["2025-06-23T12:28:40.821Z", "2025-06-23T12:29:11.072Z"],
        days_in_stage: [0, 0],
        stage: ["First Meetings", "Proposal Submitted"],
      },
      timestamp: "2025-06-23T12:29:11.274Z",
    };
    try {
      const result = await handleCopperUpdateOpportunityWebhook(payload);
      console.dir(result, { depth: null });
    } catch (error) {
      console.error("Error getting valid contact types:", error);
    }
  });
});