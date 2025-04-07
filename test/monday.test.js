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
