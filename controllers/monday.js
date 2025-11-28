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

    // Initialize variables for pagination
    // allItems will store all items retrieved from the board
    // cursor will be used for pagination
    // boardName will store the name of the board
    let allItems = [];
    let cursor = null;
    let boardName = null;

    do{
        const query = cursor ? `query ($boardId: [ID!], $cursor: String!) {
                boards (ids: $boardId) {
                    name
                    items_page (limit: 500, cursor: $cursor) {
                        cursor
                        items {
                            id
                            name
                            group {
                                id
                                title
                            }
                            column_values {
                                column {
                                    id
                                    title
                                }
                                value
                                ... on BoardRelationValue {
                                    linked_item_ids
                                    display_value
                                }
                            }
                        }
                    }
                }
            }`: `query ($boardId: [ID!]) {
                boards (ids: $boardId) {
                    name
                    items_page (limit: 500) {
                        cursor
                        items {
                            id
                            name
                            group {
                                id
                                title
                            }
                            column_values {
                                column {
                                    id
                                    title
                                }
                                value
                                ... on BoardRelationValue {
                                    linked_item_ids
                                    display_value
                                }
                            }
                        }
                    }
                }
            }`;

        // Set variables for the query
        const variables = cursor ? { boardId, cursor } : { boardId };

        // Execute the query
        const response = await monday.api(query, { variables });

        // Extract board data from results
        const boardData = response.data.boards[0];

        // Update boardName and allItems
        boardName = boardData.name;
        allItems = allItems.concat(boardData.items_page.items);

        // Update cursor for pagination
        cursor = boardData.items_page.cursor;

    } while (cursor);

    return {
        data: {
            boards: [
                {
                    name: boardName,
                    items_page: {
                        items: allItems,
                    },
                },
            ],
        },
    };


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
          settings_str
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
    const taskTitle = `${
        new Date().toISOString().split("T")[0]
    } – Request for ${newTask.client}`;

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
        text_mksnvjqg: newTask.projectCode,
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
            //Get the value for the column
            let getColumnValue = newTask[column];
            if (typeof getColumnValue === "string") {
                getColumnValue = getColumnValue
                    .replace(/\\/g, "\\\\") // Escape backslashes first
                    .replace(/"/g, '\\"') // Escape double quotes
                    .replace(/'/g, "\\'") // Escape single quotes
                    .replace(/\n/g, "\\n") // Escape newlines
                    .replace(/\r/g, "\\r") // Escape carriage returns
                    .replace(/\t/g, "\\t"); // Escape tabs
            }

            columnValues[columnId] = getColumnValue;
        }
    });

    // const column_values = JSON.stringify(columnValues)
    //     .replace(/"/g, '\\"')
    //     .replace(/\\n/g, "\\\\n");

    const payload = {
        boardId: boardId.toString(),
        itemName: newTask.name,
        columnValues: JSON.stringify(columnValues),
    };

    console.log(
        "Payload",
        JSON.stringify({
            boardId: payload.boardId,
            itemName: payload.itemName,
            columnValues: payload.columnValues,
        })
    );

    //mutation (declare the variables)
    //Use the variables in the query
    //Variables are passed in as an object
    //Returns the id of the created item

    const result = await monday.api(
        `mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
        create_item (board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
            id
        }
    }`,
        { variables: payload }
    );

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
    return addTaskToBoardWithColumns(
        newTask,
        process.env.MARKETING_MONDAY_BOARD
    );
};

const addProjectToProjectBoard = async (newTask) => {
    return addTaskToBoardWithColumns(newTask, process.env.PROJECT_MONDAY_BOARD);
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

/**
 *
 */
const getMarketingCampaignOptions = async () => {
    const response = await getMondayBoardColumns(
        process.env.MARKETING_MONDAY_BOARD
    );

    const columns = response.data.boards[0].columns;

    // Find the column with title "Campaign"
    const campaignColumn = columns.find(
        (column) => column.title === "Campaign or Initiative"
    );

    if (!campaignColumn) {
        throw new Error("Campaign column not found");
    }

    // Get the options for the Campaign column
    const options = campaignColumn.settings_str
        ? JSON.parse(campaignColumn.settings_str).labels
        : [];

    return options;
};

const getProjectCodeColumnId = async (boardId) => {
    const response = await getMondayBoardColumns(boardId);

    console.log("Board columns response", JSON.stringify(response));

    const columns = response.data.boards[0].columns;

    // Find the column with title "Project Code"
    const projectCodeColumn = columns.find(
        (column) => column.title === "Project Code"
    );

    if (!projectCodeColumn) {
        throw new Error("Project Code column not found");
    }

    return projectCodeColumn.id;
};

const getItemByProjectCode = async (boardId, projectCode) => {
    const columnId = await getProjectCodeColumnId(boardId);

    const boardIdAsString = boardId.toString();

    const response = await monday.api(
        `query ($boardId: ID!, $columnId: String!, $projectCode: String!) {
            items_page_by_column_values (
                board_id: $boardId,
                columns: [{ column_id: $columnId, column_values: [$projectCode] }],
                limit: 1
            ) {
                items {
                    id
                    name
                }
            }
        }`,
        { variables: { boardId: boardIdAsString, columnId, projectCode } }
    );

    console.log("Get item by project code response", response);

    const items = response.data.items_page_by_column_values?.items || [];

    return items.length > 0 ? items[0] : null;
};

const getGroupIdByTitle = async (boardId, groupTitleOrTitles) => {
    const response = await monday.api(
        `query ($boardId: [ID!]) {
      boards (ids: $boardId) {
        groups {
          id
          title
        }
      }
    }`,
        { variables: { boardId } }
    );

    const groups = response.data.boards[0].groups;

    const candidateTitles = Array.isArray(groupTitleOrTitles)
        ? groupTitleOrTitles
        : [groupTitleOrTitles];

    const normalizedCandidates = candidateTitles
        .filter(Boolean)
        .map((title) => title.trim().toLowerCase());

    const matchingGroup = groups.find((group) => {
        if (!group.title) {
            return false;
        }

        const normalizedGroupTitle = group.title.trim().toLowerCase();

        return normalizedCandidates.includes(normalizedGroupTitle);
    });

    return {
        groupId: matchingGroup ? matchingGroup.id : null,
        groups,
    };
};

const moveTaskToCompletedGroup = async (taskId, boardId) => {
    const envProvidedTitles = (process.env.MONDAY_COMPLETED_GROUP_TITLES || "")
        .split(",")
        .map((title) => title.trim())
        .filter(Boolean);

    const { groupId: completedGroupId, groups } = await getGroupIdByTitle(
        boardId,
        [...envProvidedTitles, "Completed", "Complete", "Done"]
    );

    if (!completedGroupId) {
        throw new Error(
            `Completed group not found. Looked for: ${[
                ...envProvidedTitles,
                "Completed",
                "Complete",
                "Done",
            ]
                .filter(Boolean)
                .join(", ")}. Available groups: ${groups
                .map((group) => group.title || "<untitled>")
                .join(", ")}`
        );
    }

    const result = await monday.api(
        `mutation ($itemId: ID!, $groupId: String!) {
        move_item_to_group (item_id: $itemId, group_id: $groupId) {
            id
        }
    }`,
        {
            variables: {
                itemId: taskId.toString(),
                groupId: completedGroupId.toString(),
            },
        }
    );

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
    addProjectToProjectBoard,
    getMondayUserByEmail,
    updateAssignedUser,
    assignCompanyCode,
    getMarketingCampaignOptions,
    addTaskToBoardWithColumns,
    getItemByProjectCode,
    getGroupIdByTitle,
    moveTaskToCompletedGroup,
    getMondayMembers,
};
