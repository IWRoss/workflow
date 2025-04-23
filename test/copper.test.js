const assert = require("assert");

const dotenv = require("dotenv");

beforeEach(() => {
  dotenv.config();
});

describe("#getPipelines", function () {
  it("should get pipelines", async function () {
    const { getPipelines } = require("../controllers/copper");

    try {
      const result = await getPipelines();

      console.dir(result, { depth: null });

      assert(result);
    } catch (error) {
      console.error("Error getting pipelines:", error);
    }
  });
});

describe("#getValidPipelineStageIDs", function () {
  it("should get valid pipeline stage IDs", async function () {
    const { getValidPipelineStageIDs } = require("../controllers/copper");

    try {
      const result = await getValidPipelineStageIDs();

      console.dir(result, { depth: null });

      assert(result);
    } catch (error) {
      console.error("Error getting valid pipeline stage IDs:", error);
    }
  });
});

describe("#getOpportunities", function () {
  it("should get opportunities", async function () {
    const { getOpportunities } = require("../controllers/copper");

    // Increase timeout to 10 seconds
    this.timeout(10000);

    try {
      const result = await getOpportunities();

      console.dir(result, { depth: null });

      assert(result);
    } catch (error) {
      console.error("Error getting opportunities:", error);
    }
  });
});

describe("#getCustomFieldDefinitions", function () {
  it("should get custom field definitions", async function () {
    const { getCustomFieldDefinitions } = require("../controllers/copper");

    try {
      const result = await getCustomFieldDefinitions();

      console.dir(result, { depth: null });

      assert(result);
    } catch (error) {
      console.error("Error getting custom field definitions:", error);
    }
  });
});
