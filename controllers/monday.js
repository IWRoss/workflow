const mondaySdk = require("monday-sdk-js");

// Create a variable to store our SDK
const monday = mondaySdk();

// Set token
monday.setToken(process.env.MONDAY_TOKEN);

const getMonday = async () => {
  // Get the Monday.com instance
  const monday = mondaySdk();

  // Set token
  monday.setToken(process.env.MONDAY_TOKEN);

  return monday;
};

/**
 * Get Monday board
 */
const getMondayBoard = async (boardId) => {
  // Get the board
  const board = await monday.api(
    `query ($boardId: [ID!]) {
      boards (ids: $boardId) {
        name
        items_page {
          items {
            id
            name
            column_values {
              column {
                id
                title
              }
              value
            }
          }
        }
      }
    }`,
    { variables: { boardId } } // Adjust page and limit as needed
  );

  return board;
};

/**
 * Get the columns in a Monday board
 */
const getMondayBoardColumns = async (boardId) => {
  // Get the board
  const board = await monday.api(
    `query ($boardId: [ID!]) {
      boards (ids: $boardId) {
        columns {
          id
          title
        }
      }
    }`,
    { variables: { boardId } } // Adjust page and limit as needed
  );

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

  const safeNotes = typeof newTask.notes === "string" ? newTask.notes : "";

  const columnValues = JSON.stringify({
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
    details: safeNotes,
  });

  const variables = {
    boardId: boardId.toString(),
    itemName: taskTitle.toString(),
    columnValues: columnValues.toString(),
  };

  // Add item to board with column values
  const result = await monday.api(
    `mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item (
        board_id: $boardId,
        item_name: $itemName,
        column_values: $columnValues 
      ) {
        id
      }
    }`,
    { variables }
  );

  console.log("Create item request", JSON.stringify(result));

  // // Add an update with the note
  // const addNoteRequest = await monday.api(`mutation {
  //   create_update (item_id: ${result.data.create_item.id}, body: "${newTask.notes}") {
  //     id
  //   }
  // }`);

  // console.log("Add note request", JSON.stringify(addNoteRequest));

  return result;
};

const addTaskToBoardWithColumns = async (newTask, boardId) => {
  const response = await getMondayBoardColumns(boardId);

  const columns = response.data.boards[0].columns;

  const taskColumns = Object.keys(newTask);

  const columnValues = {};
  const columnIds = columns.map((column) => column.id);
  const columnTitles = columns.map((column) => column.title);

  taskColumns.forEach((column) => {
    const columnId = columnIds[columnTitles.indexOf(column)];

    if (columnId) {
      columnValues[columnId] = newTask[column];
    }
  });

  const column_values = JSON.stringify(columnValues)
    .replace(/"/g, '\\"')
    .replace(/\\n/g, "\\\\n");

  console.log(
    "Payload",
    JSON.stringify({
      boardId,
      newTask: newTask.name,
      column_values: column_values,
    })
  );

  const result = await monday.api(`mutation {
    create_item (board_id: ${boardId}, item_name: "${newTask.name}", column_values: "${column_values}") {
      id
    }
  }`);

  console.log("Create item request", JSON.stringify(result));

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

const addTaskToOpsBoard = async (newTask) => {
  return addTaskToBoardWithColumns(newTask, process.env.OPS_MONDAY_BOARD);
};

const addTaskToMarketingBoard = async (newTask) => {
  return addTaskToBoardWithColumns(newTask, process.env.MARKETING_MONDAY_BOARD);
};

/**
 * Update assigned user on task
 */
const updateAssignedUser = async (userId, taskId, boardId) => {
  const response = await getMondayBoardColumns(boardId);

  const columns = response.data.boards[0].columns;

  // Get the column ID for the "Assigned to" column
  const assignedToColumn = columns.find(
    (column) => column.title === "Assigned to"
  );

  // Update the task
  const result = await monday.api(`mutation {
    change_simple_column_value (item_id: ${taskId}, board_id: ${boardId}, column_id: "${assignedToColumn.id}", value: "${userId}") 
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

const assignCompanyCode = async (companyId, companyCode) => {
  const columnId = "companyCode"; // Replace with the actual column ID for company code

  const columnValue = JSON.stringify({
    value: companyCode,
  }).replace(/"/g, '\\"');

  const result = await monday.api(`mutation {
    change_column_value (board_id: ${process.env.COMPANY_BOARD_ID}, item_id: ${companyId}, column_id: "${columnId}", value: "${columnValue}") {
      id
    }
  }`);

  return result;
};

module.exports = {
  getMonday,
  getMondayBoard,
  getMondayBoardColumns,
  getStudioRequestsBoard,
  getCommTechRequestsBoard,
  addTaskToStudioBoard,
  addTaskToCommTechBoard,
  addTaskToBoard,
  addTaskToOpsBoard,
  addTaskToMarketingBoard,
  getMondayUserByEmail,
  updateAssignedUser,
  assignCompanyCode,
};
