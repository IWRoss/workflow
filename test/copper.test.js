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

      console.dir(
        result.find((opp) => opp.id === 33576360),
        { depth: null }
      );

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

describe("#subscribeToCopperWebhook", function () {
  it("should subscribe to Copper webhook", async function () {
    const { subscribeToCopperWebhook } = require("../controllers/copper");

    try {
      const result = await subscribeToCopperWebhook(
        process.env.COPPER_WEBHOOK_URL
      );

      console.dir(result, { depth: null });

      assert(result);
    } catch (error) {
      console.error("Error subscribing to Copper webhook:", error);
    }
  });
});

describe("#unsubscribeFromCopperWebhook", function () {
  it("should unsubscribe from Copper webhook", async function () {
    const { unsubscribeFromCopperWebhook } = require("../controllers/copper");

    try {
      const result = await unsubscribeFromCopperWebhook(
        "462311"
      );

      console.dir(result, { depth: null });

      assert(result);
    } catch (error) {
      console.error("Error unsubscribing from Copper webhook:", error);
    }
  });
});

describe("#listAllCopperWebhooks", function () {
  it("should list all Copper webhooks", async function () {
    const { listAllCopperWebhooks } = require("../controllers/copper");

    try {
      const result = await listAllCopperWebhooks();

      console.dir(result, { depth: null });

      assert(result);
    } catch (error) {
      console.error("Error listing all Copper webhooks:", error);
    }
  });
});

describe("#assignCompanyCode", function () {
  it("should assign company code", async function () {
    const { assignCompanyCode } = require("../controllers/copper");

    const clientTestData = require("../data/clientsTestData");

    clientTestData.forEach(async (company) => {
      try {
        const result = await assignCompanyCode(company);

        console.log(company.name, result);

        assert(result);
      } catch (error) {
        console.error("Error assigning company code:", error);
      }
    });
  });
});

describe("#createCompanyCode", function () {
  it("should create company code", async function () {
    const { createCompanyCode } = require("../controllers/copper");

    const companyName = "Schindler";

    try {
      const result = await createCompanyCode(companyName);

      console.log(companyName, result);

      assert(result);
    } catch (error) {
      console.error("Error creating company code:", error);
    }
  });
});

describe("assignCompaniesCompanyCodes", function () {
  it("should assign company codes to companies", async function () {
    this.timeout(10000); // Increase timeout to 10 seconds

    // Get all companies
    const {
      getCompanies,
      assignCompanyCode,
    } = require("../controllers/copper");

    const companies = await getCompanies();

    for (const company of companies) {
      try {
        const result = await assignCompanyCode(company, true);

        console.log(company.name, result);
      } catch (error) {
        console.error("Error assigning company code:", error);
      }
    }
  });
});

describe("#getValidContactTypes", function () {
  it("should get valid contact types", async function () {
    const { getValidContactTypes } = require("../controllers/copper");

    try {
      const result = await getValidContactTypes();

      console.dir(result, { depth: null });

      assert(result);
    } catch (error) {
      console.error("Error getting valid contact types:", error);
    }
  });
});

//Get a list of all the copper users
describe("#getCopperUsers", function () {
  it("should get all Copper users", async function () {
    const { getCopperUsers } = require("../controllers/copper");

    try {
      const result = await getCopperUsers();

      console.dir(result, { depth: null });

      assert(result);
    } catch (error) {
      console.error("Error getting Copper users:", error);
    }
  });
}
);
