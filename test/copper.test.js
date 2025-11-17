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
        const {
            unsubscribeFromCopperWebhook,
        } = require("../controllers/copper");

        try {
            const result = await unsubscribeFromCopperWebhook("462311");

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
});

describe("#getCopperUserById", function () {
    it("should get a Copper user by ID", async function () {
        const { getCopperUserById } = require("../controllers/copper");

        const userId = 901648; // Replace with a valid user ID

        try {
            const result = await getCopperUserById(userId);

            console.dir(result, { depth: null });

            assert(result);
        } catch (error) {
            console.error("Error getting Copper user by ID:", error);
        }
    });
});

describe("#getWonOpportunities", function () {
    it("should get won opportunities", async function () {
        const { getWonOpportunities } = require("../controllers/copper");

        // Increase timeout to 10 seconds
        this.timeout(10000);

        try {
            const result = await getWonOpportunities();

            console.log(
                result.map((opp) => ({ id: opp.id, stage: opp.stageName }))
            );

            // console.dir(
            //     result.find((opp) => opp.id === 35400989),
            //     { depth: null }
            // );

            assert(result);
        } catch (error) {
            console.error("Error getting won opportunities:", error);
        }
    });
});

describe("#addOpportunityToProjectBoard", function () {
    it("should add an opportunity to the project board", async function () {
        const {
            getWonOpportunities,
            addOpportunityToProjectBoard,
        } = require("../controllers/copper");

        // Increase timeout to 10 seconds
        this.timeout(10000);

        try {
            const opportunities = await getWonOpportunities();

            console.log(
                opportunities.map((opp) => ({
                    id: opp.id,
                    stage: opp.stageName,
                    name: opp.name,
                }))
            );

            // Select opp.id === 35400989
            const opportunity = opportunities.find(
                (opp) => opp.id === 35400989
            );

            const result = await addOpportunityToProjectBoard(opportunity);

            console.dir(result, { depth: null });

            assert(result);
        } catch (error) {
            console.error("Error adding opportunity to project board:", error);
        }
    });
});

describe("#addWonOpportunitiesToProjectBoard", function () {
    it("should add won opportunities to the project board", async function () {
        const {
            addWonOpportunitiesToProjectBoard,
        } = require("../controllers/copper");

        // Increase timeout to 20 seconds
        this.timeout(0);

        try {
            const result = await addWonOpportunitiesToProjectBoard();

            console.dir(result, { depth: null });

            return assert(result);
        } catch (error) {
            console.error(
                "Error adding won opportunities to project board:",
                error
            );
        }
    });
});

describe("#getOpportunityWithWizardData", function () {
    it("should get opportunity with wizard data", async function () {
        const {
            getOpportunityWithWizardData,
        } = require("../services/copper/opportunities");

        const opportunityId = 36373179; // Replace with a valid opportunity ID

        try {
            const result = await getOpportunityWithWizardData(opportunityId);

            console.dir(result, { depth: null });

            assert(result);
        } catch (error) {
            console.error("Error getting opportunity with wizard data:", error);
        }
    });
});

describe("#updateOpportunityWizardData", function () {
    it("should update opportunity wizard data", async function () {
        const {
            updateOpportunityWizardData,
        } = require("../services/copper/opportunities");

        const opportunityId = 36373179; // Replace with a valid opportunity ID

        const wizardData = { testField: "testValue" }; // Replace with valid wizard data

        try {
            const result = await updateOpportunityWizardData(
                opportunityId,
                wizardData
            );

            console.dir(result, { depth: null });

            assert(result);
        } catch (error) {
            console.error("Error updating opportunity wizard data:", error);
        }
    });

    it("should throw an error when opportunity wizard data is too large", async function () {
        const {
            updateOpportunityWizardData,
        } = require("../services/copper/opportunities");

        const opportunityId = 36373179; // Replace with a valid opportunity ID

        // Create wizard data that exceeds the size limit
        const wizardData = {
            largeField: "x".repeat(100000), // 100,000 characters
        };

        try {
            await updateOpportunityWizardData(opportunityId, wizardData);
            assert.fail("Expected error was not thrown");
        } catch (error) {
            console.log("Caught expected error:", error.message);
            assert(
                error.message.includes("Wizard data is too large"),
                "Unexpected error message"
            );
        }
    });
});
