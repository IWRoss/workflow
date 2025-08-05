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

//Add approved requests to google sheets
const addApprovedRequestToGoogleSheets = async (
    requestData,
    approvedByID,
    approvedByName
) => {
    const sheets = initialiseGoogleSheets();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Prepare the row data
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
        requestData.denialReason || "",
        new Date().toISOString().split("T")[0], // YYYY-MM-DD format
    ];

    try {
        // Append the row to the Google Sheet
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: "Sheet1!A:I",
            valueInputOption: "RAW",
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
        console.error("Error adding approved request to Google Sheets:", error);
    }
};

module.exports = {
    isValidHttpUrl,
    clearRequireCache,
    camelCaseToCapitalCase,
    isBetaUser,
    initialiseGoogleSheets,
    addApprovedRequestToGoogleSheets,
};
