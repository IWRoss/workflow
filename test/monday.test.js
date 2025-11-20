const assert = require("assert");

const dotenv = require("dotenv");

beforeEach(() => {
    dotenv.config();
});

describe("#addTaskToCommTechBoard", function () {
    it("should add a task to the board", async function () {
        const { addTaskToCommTechBoard } = require("../controllers/monday");

        const clients = require("../data/clients");

        const newTask = {
            user: 17535229,
            client: clients[0],
            producerDeadline: "2023-10-01",
            clientDeadline: "2023-10-01",
            dropboxLink: "https://example.com",
            media: "Other",
            notes: "Task notes",
        };

        try {
            const result = await addTaskToCommTechBoard(newTask);

            console.log("Task added:", result);

            assert(result);
        } catch (error) {
            console.error("Error adding task:", error);
        }
    });
});

describe("#getMondayBoard", function () {
    it("should get the Monday board", async function () {
        const { getMondayBoard } = require("../controllers/monday");

        try {
            const result = await getMondayBoard(process.env.OPS_MONDAY_BOARD);

            console.dir(result, { depth: null });

            assert(result);
        } catch (error) {
            console.error("Error getting Monday board:", error);
        }
    });
});

describe("#addTaskToOpsBoard", function () {
    it("should add a task to the Ops board", async function () {
        const { addTaskToOpsBoard } = require("../controllers/monday");

        const newTask = {
            name: "Panasonic Benefits Team Offsite",
            "Project Code": "PBT-2023",
            "Likely Invoice Date": "2023-10-01",
            "Submitted Date": "2023-10-01",
            "Consulting Fees": 1000,
            "Studio Fees": 1000,
            "Project Fees": 1000,
            "Invoicing Email": `${"ross.hardy@cegos.uk"} Link`,
        };

        try {
            const result = await addTaskToOpsBoard(newTask);

            console.log("Task added:", result);

            assert(result);
        } catch (error) {
            console.error("Error adding task:", error);
        }
    });
});

describe("#getMarketingCampaignOptions", function () {
    it("should get marketing campaign options", async function () {
        const {
            getMarketingCampaignOptions,
        } = require("../controllers/monday");

        try {
            const result = await getMarketingCampaignOptions();

            console.dir(result, { depth: null });

            assert(result);
        } catch (error) {
            console.error("Error getting marketing campaign options:", error);
        }
    });
});

describe("#getGroupIdByTitle", function () {
    it("should get group ID by title", async function () {
        const { getGroupIdByTitle } = require("../controllers/monday");

        try {
            const result = await getGroupIdByTitle(
                process.env.PROJECT_MONDAY_BOARD,
                "Completed"
            );

            console.dir(result, { depth: null });

            assert(result);
        } catch (error) {
            console.error("Error getting group ID by title:", error);
        }
    });
});

describe("#moveTaskToCompletedGroup", function () {
    it("should move task to Completed group", async function () {
        const { moveTaskToCompletedGroup } = require("../controllers/monday");

        this.timeout(10000);

        try {
            const result = await moveTaskToCompletedGroup(
                "18073671132",
                process.env.PROJECT_MONDAY_BOARD
            );

            console.dir(result, { depth: null });

            assert(result);
        } catch (error) {
            console.error("Error moving task to Completed group:", error);
        }
    });
});
