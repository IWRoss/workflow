const { options } = require("nodemon/lib/config");

/**
 * Axios
 */
const isValidHttpUrl = (string) => {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
};

/**
 *
 */
const clearRequireCache = () => {
    Object.keys(require.cache).forEach((key) => {
        delete require.cache[key];
    });
};

/**
 * Camel case to capital case
 */
const camelCaseToCapitalCase = (str) => {
    return str
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (str) => str.toUpperCase());
};

/**
 * Is beta user on Slack
 */
const isBetaUser = (userId) => {
    const betaUsers = process.env.BETA_USERS;

    if (!betaUsers) {
        return false;
    }

    const betaUsersArray = betaUsers.split(",");

    return betaUsersArray.includes(userId);
};

//Google sheets helper
const initialiseGoogleSheets = () => {
    const { google } = require("googleapis");
    const { JWT } = require("google-auth-library");

    const auth = new JWT({
        email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    return google.sheets({ version: "v4", auth });
};

const addRowToGoogleSheets = async (rowData, options = {}) => {
    const {
        spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
        range = "Sheet1!A:Z",
        valueInputOption = "RAW",
    } = options;

    const sheets = initialiseGoogleSheets();

    try {
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption,
            requestBody: {
                values: [rowData],
            },
        });

        console.log("Data added to Google Sheets:", response.data);
        return {
            success: true,
            updatedRange: response.data.updates.updatedRange,
            updatedRows: response.data.updates.updatedRows,
        };
    } catch (error) {
        console.error("Error adding row to Google Sheets:", error);
        return {
            success: false,
            error: error.message,
        };
    }
};

//Add approved requests to google sheets
const addSpendRequestToGoogleSheets = async (
    requestData,
    approvedByID,
    approvedByName
) => {
    const rowData = [
        requestData.action,
        requestData.requestId,
        requestData.requestedBy,
        requestData.userId,
        requestData.spendType,
        requestData.department,
        requestData.client,
        requestData.projectCode,
        requestData.notes,
        approvedByID,
        approvedByName,
        requestData.textfieldValue || "",
        new Date().toISOString().split("T")[0],  
        requestData.numberOfAttendees || "",
        requestData.numberOfClients || "",
        requestData.numberOfInternalStaff || "",
    ];

    return await addRowToGoogleSheets(rowData, {
        range: "Sheet1!A:P", 
    });
};

module.exports = {
    isValidHttpUrl,
    clearRequireCache,
    camelCaseToCapitalCase,
    isBetaUser,
    initialiseGoogleSheets,
    addSpendRequestToGoogleSheets,
    addRowToGoogleSheets
    
};
