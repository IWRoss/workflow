const { google } = require("googleapis");

// Authenticate with Google using service account
const getGoogleAuth = () => {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        },
        scopes: [
            "https://www.googleapis.com/auth/documents",
            "https://www.googleapis.com/auth/drive",
        ],
    });
    return auth;
};

/**
 * Copy a Google Doc template and populate it with SOW data
 */
const createSowDocument = async (sowData) => {
    const auth = getGoogleAuth();
    const docs = google.docs({ version: "v1", auth });
    const drive = google.drive({ version: "v3", auth });

    const templateId = process.env.GOOGLE_SOW_TEMPLATE_ID;
    const folderId = process.env.GOOGLE_SOW_FOLDER_ID;

    // Step 1: Copy the template
    const copy = await drive.files.copy({
        supportsAllDrives: true,

        fileId: templateId,
        requestBody: {
            name: `SOW - ${sowData.projectCode || "N/A"} - ${sowData.client || "N/A"} - ${sowData.projectName || "N/A"}`,
            parents: folderId ? [folderId] : undefined,
        },
    });

    const newDocId = copy.data.id;

    // Step 2: Replace placeholders in the document
    const replacements = {
        "{{PROJECT_CODE}}": sowData.projectCode || "",
        "{{PROJECT_NAME}}": sowData.projectName || "",
        "{{CLIENT}}": sowData.client || "",
        "{{CLIENT_EMAIL}}": sowData.clientEmail || "",
        "{{TIMELINE_START}}": sowData.timeline?.startDate || "",
        "{{TIMELINE_END}}": sowData.timeline?.endDate || "",
        "{{WORK_DESCRIPTION}}": sowData.workDescription || "",
        "{{TEAM_MEMBERS}}": sowData.teamMembers || "",
        "{{STATUS}}": sowData.status || "",
        "{{DATE_CREATED}}": sowData.createdAt || new Date().toISOString(),
    };

    const requests = Object.entries(replacements).map(
        ([placeholder, value]) => ({
            replaceAllText: {
                containsText: {
                    text: placeholder,
                    matchCase: true,
                },
                replaceText: value,
            },
        }),
    );

    await docs.documents.batchUpdate({
        documentId: newDocId,
        requestBody: { requests },
    });

    // Step 3: Set permissions (anyone with link can edit)
    await drive.permissions.create({
        fileId: newDocId,
            supportsAllDrives: true,

        requestBody: {
            role: "writer",
            type: "anyone",
        },
    });

    const docUrl = `https://docs.google.com/document/d/${newDocId}/edit`;

    return { docId: newDocId, docUrl };
};

module.exports = { createSowDocument };