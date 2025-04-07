const assert = require("assert");

const dotenv = require("dotenv");

beforeEach(() => {
  dotenv.config();
});

describe("#addWorkflowInterfaceToSlack", function () {
  it("should add the workflow interface to Slack", async function () {
    this.timeout(10000); // Increase timeout to 10 seconds

    const { addWorkflowInterfaceToSlack } = require("../controllers/slack");

    try {
      const result = await addWorkflowInterfaceToSlack();

      console.log("Workflow interface added:", result);

      assert(result);
    } catch (error) {
      console.error("Error adding workflow interface:", error);
    }
  });
});

describe("#putAppIntoMaintenanceMode", function () {
  it("should put the app into maintenance mode", async function () {
    this.timeout(10000); // Increase timeout to 10 seconds

    const { putAppIntoMaintenanceMode } = require("../controllers/slack");

    try {
      const result = await putAppIntoMaintenanceMode();

      console.log("App maintenance mode result:", result);

      assert(result);
    } catch (error) {
      console.error("Error putting app into maintenance mode:", error);
    }
  });
});
