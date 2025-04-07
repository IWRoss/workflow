const assert = require("assert");

const dotenv = require("dotenv");

beforeEach(() => {
  dotenv.config();
});

describe("#monday", function () {
  // it("should add a long text column with the name Details to a board", async function () {
  //   const { getMonday } = require("../controllers/monday");

  //   const monday = await getMonday();

  //   const boardId = process.env.STUDIO_MONDAY_BOARD;
  //   const columnName = "Details";

  //   const convertColumnNameToSlug = (name) => {
  //     return name
  //       .replace(/\s+/g, "_")
  //       .replace(/[^a-zA-Z0-9_]/g, "")
  //       .toLowerCase();
  //   };

  //   try {
  //     const result = await monday.api(
  //       `mutation {
  //         create_column (board_id: ${boardId}, title: "${columnName}", column_type: long_text, id: "${convertColumnNameToSlug(
  //         columnName
  //       )}") {
  //           id
  //           title
  //           type
  //         }
  //       }`
  //     );

  //     console.log("Column created:", result);

  //     assert(result);
  //   } catch (error) {
  //     console.error("Error creating column:", error);
  //   }
  // });

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
