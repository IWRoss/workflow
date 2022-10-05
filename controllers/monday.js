const mondaySdk = require("monday-sdk-js");

// Create a variable to store our SDK
const monday = mondaySdk();

// Set token
monday.setToken(process.env.MONDAY_TOKEN);

/**
 * Get the Design Requests board
 */
const getDesignRequestsBoard = async () => {
  // Get the Design Requests board
  const board = await monday.api(`query {
    boards (ids: ${process.env.MONDAY_BOARD}) {
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
 * Add item to design requests board
 */
const addDesignRequest = async (newTask) => {
  const taskTitle = `${new Date().toISOString().split("T")[0]} – Request for ${
    newTask.client
  }`;

  // Add item to board with column values
  const result = await monday.api(`mutation {
    create_item (board_id: ${
      process.env.MONDAY_BOARD
    }, item_name: "${taskTitle}", column_values: "${JSON.stringify({
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
  }).replace(/"/g, '\\"')}") {
      id
    }
  }`);

  console.log(result);

  // Add an update with the note
  const addNoteRequest = await monday.api(`mutation {
    create_update (item_id: ${result.data.create_item.id}, body: "${newTask.notes}") {
      id
    }
  }`);

  return result;
};

/**
 * Update assigned user on task
 */
const updateAssignedUser = async (userID, taskID) => {
  const columnValue = JSON.stringify({
    personsAndTeams: [
      {
        id: userID,
        kind: "person",
      },
    ],
  }).replace(/"/g, '\\"');

  console.log(String(taskID));

  // Update the task
  const result = await monday.api(`mutation {
    change_simple_column_value (item_id: ${taskID}, board_id: ${process.env.MONDAY_BOARD}, column_id: "people", value: "${userID}") 
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
  getDesignRequestsBoard,
  addDesignRequest,
  getMondayUserByEmail,
  updateAssignedUser,
};