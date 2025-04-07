const mondaySdk = require("monday-sdk-js");

// Create a variable to store our SDK
const monday = mondaySdk();

// Set token
monday.setToken(process.env.MONDAY_TOKEN);

/**
 * Get Monday board
 */
const getMondayBoard = async (boardId) => {
  // Get the board
  const board = await monday.api(`query {
    boards (ids: ${boardId}) {
      name
      items {
        name
        column_values {
          id
          title
          text
        }
      }
    }
  }`);

  return board;
};

/**
 * Get the Studio Requests board
 */
const getStudioRequestsBoard = async () =>
  getMondayBoard(process.env.STUDIO_MONDAY_BOARD);

/**
 * Get the CommTech Requests board
 */
const getCommTechRequestsBoard = async () =>
  getMondayBoard(process.env.COMMTECH_MONDAY_BOARD);

const addTaskToBoard = async (newTask, boardId) => {
  const taskTitle = `${new Date().toISOString().split("T")[0]} – Request for ${
    newTask.client
  }`;

  // Add item to board with column values
  const result = await monday.api(`mutation {
    create_item (board_id: ${boardId}, item_name: "${taskTitle}", column_values: "${JSON.stringify(
    {
      person: {
        personsAndTeams: [
          {
            id: newTask.user,
            kind: "person",
          },
        ],
      },
      dropdown: newTask.client,
      date4: newTask.producerDeadline,
      date: newTask.clientDeadline,
      link: {
        url: newTask.dropboxLink,
        text: "Link",
      },
      dropdown8: newTask.media,
    }
  ).replace(/"/g, '\\"')}") {
      id
    }
  }`);

  console.log("Create item request", JSON.stringify(result));

  // Add an update with the note
  const addNoteRequest = await monday.api(`mutation {
    create_update (item_id: ${result.data.create_item.id}, body: "${newTask.notes}") {
      id
    }
  }`);

  console.log("Add note request", JSON.stringify(addNoteRequest));

  return result;
};

/**
 * Add item to studio requests board
 */
const addTaskToStudioBoard = async (newTask) => {
  return addTaskToBoard(newTask, process.env.STUDIO_MONDAY_BOARD);
};

const addTaskToCommTechBoard = async (newTask) => {
  return addTaskToBoard(newTask, process.env.COMMTECH_MONDAY_BOARD);
};

/**
 * Update assigned user on task
 */
const updateAssignedUser = async (userId, taskId, boardId) => {
  const columnValue = JSON.stringify({
    personsAndTeams: [
      {
        id: userId,
        kind: "person",
      },
    ],
  }).replace(/"/g, '\\"');

  console.log(String(taskId));

  // Update the task
  const result = await monday.api(`mutation {
    change_simple_column_value (item_id: ${taskId}, board_id: ${boardId}, column_id: "people", value: "${userId}") 
    {
      id
    }
  }`);

  return result;
};

/**
 * Get list of Monday.com users
 */
const getMondayMembers = async () => {
  // Get list of members
  const members = await monday.api(`query {
    users {
      id
      name
      email
    }
  }`);

  return members.data.users;
};

/**
 *
 */
const getMondayUserByEmail = async (email) => {
  // Get list of members
  const members = await getMondayMembers();

  // Find member by email
  const member = members.find((m) => m.email === email);

  return member;
};

module.exports = {
  getStudioRequestsBoard,
  getCommTechRequestsBoard,
  addTaskToStudioBoard,
  addTaskToCommTechBoard,
  addTaskToBoard,
  getMondayUserByEmail,
  updateAssignedUser,
};
