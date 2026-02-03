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


//Get all task rows from a monday board
describe("#getAllTaskRowsFromBoard", function () {
    it("should get all task rows from a monday board", async function () {
        const { getMondayBoard } = require("../controllers/monday");

        this.timeout(10000);

        try {
            const result = await getMondayBoard(
                process.env.STUDIO_MONDAY_BOARD
            );

            const rows = result.data.boards[0].items_page.items;

            //Select only the name and project code, Project column and Client column values
            const selectedRows = rows.map(row => {
                // Find each column value by exact column ID
                const projectCodeColumn = row.column_values.find(
                    col => col.column.id === "text_mksnvjqg"
                );
                const projectColumn = row.column_values.find(
                    col => col.column.id === "board_relation_mkxsg758"
                );

                return {
                    id: row.id,
                    name: row.name,
                    projectCode: projectCodeColumn?.value ? JSON.parse(projectCodeColumn.value) : null,
                    linkedProjectIds: projectColumn?.linked_item_ids || null, // Array of linked project IDs
                    projectDisplay: projectColumn?.display_value || null, // Human-readable project name
                };
            });

            console.dir(selectedRows, { depth: null });

            assert(selectedRows);
            assert(selectedRows.length > 0, "Should have at least one row");
        } catch (error) {
            console.error("Error getting all task rows from board:", error);
        }
    });
});

//Function to select each row from the board and return the name and the project code column value
describe("#getTaskNamesAndProjectCodes", function () {
    it("should get task names and project codes from a monday board", async function () {
        const { getAllTaskRowsFromBoard } = require("../controllers/monday");
        this.timeout(10000);
        
        const rows = await getAllTaskRowsFromBoard(
            process.env.OPS_MONDAY_BOARD
        );
        
        console.dir(rows, { depth: null });
        
        // Add assertions
        assert(Array.isArray(rows), "Should return an array");
        assert(rows.length > 0, "Should have at least one row");
        assert(rows[0].id, "Row should have an id");
        assert(rows[0].name, "Row should have a name");
    });
});


//Attach the task to project by project code
describe("#linkExistingTaskToProject", function () {
    it("should link existing Studio task to OPS parent project", async function () {
        const {
            linkTaskToProject,
            getMondayBoard,
        } = require("../controllers/monday");

        this.timeout(10000);

        // Existing task ID in Studio board
        const studioTaskId = "18387593542";
        
        // Parent project ID in OPS board
        const opsProjectId = "18073919384";
        
        // Studio board ID
        const studioBoardId = process.env.STUDIO_MONDAY_BOARD;

        try {
            console.log("\n=== Linking Task to Project ===");
            console.log(`Studio Task ID: ${studioTaskId}`);
            console.log(`OPS Project ID: ${opsProjectId}`);
            console.log(`Studio Board ID: ${studioBoardId}`);

            // Link the task to the project
            console.log("\n1. Linking task to project...");
            const linkResult = await linkTaskToProject(
                studioTaskId,
                opsProjectId,
                studioBoardId
            );

            console.log("Link result:", linkResult);

            // Verify the link was created
            console.log("\n2. Verifying the link...");
            const studioBoard = await getMondayBoard(studioBoardId);
            const studioRows = studioBoard.data.boards[0].items_page.items;

            const linkedTask = studioRows.find(
                (row) => row.id === studioTaskId
            );

            assert(linkedTask, "Task should exist in Studio board");
            console.log(`Task found: ${linkedTask.name}`);

            // Check the Project column (board relation)
            const projectColumn = linkedTask.column_values.find(
                (col) => col.column.id === "board_relation_mkxsg758"
            );

            console.log("\n3. Checking Project column:");
            console.log("   - Column title:", projectColumn?.column?.title);
            console.log("   - Linked item IDs:", projectColumn?.linked_item_ids);
            console.log("   - Display value:", projectColumn?.display_value);

            assert(projectColumn, "Project column should exist");
            assert(
                projectColumn.linked_item_ids,
                "Should have linked_item_ids"
            );
            assert(
                projectColumn.linked_item_ids.length > 0,
                "Should be linked to at least one project"
            );

            const linkedProjectId = projectColumn.linked_item_ids[0].toString();

            assert.strictEqual(
                linkedProjectId,
                opsProjectId,
                `Task should be linked to project ${opsProjectId}`
            );

            console.log("\n=== Test Summary ===");
            console.log(`Task ID: ${studioTaskId}`);
            console.log(`Project ID: ${opsProjectId}`);
            console.log(`Linked successfully!`);
            console.log(`Display: ${projectColumn.display_value}\n`);

        } catch (error) {
            console.error("\n Test failed:", error);
            console.error("Error message:", error.message);
            throw error;
        }
    });
});
        