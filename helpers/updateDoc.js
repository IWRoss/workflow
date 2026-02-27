const { google } = require("googleapis");
const {
    replaceWithFormattedMarkdown,
} = require("../helpers/markdownToGoogleDocs");

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
    try {
        const auth = getGoogleAuth();
        const docs = google.docs({ version: "v1", auth });
        const drive = google.drive({ version: "v3", auth });

        const templateId = process.env.GOOGLE_SOW_TEMPLATE_ID;
        const folderId = process.env.GOOGLE_SOW_FOLDER_ID;

        // Validate required environment variables
        if (!templateId) {
            throw new Error(
                "GOOGLE_SOW_TEMPLATE_ID is not configured in environment variables",
            );
        }

        // Copy the template
        let copy;
        try {
            copy = await drive.files.copy({
                supportsAllDrives: true,
                fileId: templateId,
                requestBody: {
                    name: `SOW - ${sowData.projectCode || "N/A"} - ${sowData.client || "N/A"} - ${sowData.projectName || "N/A"}`,
                    parents: folderId ? [folderId] : undefined,
                },
            });
        } catch (error) {
            console.error("Error copying template:", error);
            throw new Error(`Failed to copy SOW template: ${error.message}`);
        }

        const newDocId = copy.data.id;

        if (!newDocId) {
            throw new Error(
                "Failed to create document - no document ID returned",
            );
        }

        const replacements = {
            "{{PROJECT_CODE}}": sowData.projectCode || "",
            "{{PROJECT_NAME}}": sowData.projectName || "",
            "{{CLIENT}}": sowData.client || "",
            "{{CLIENT_EMAIL}}": sowData.clientEmail || "",
            "{{TIMELINE_START}}": sowData.timeline?.startDate || "",
            "{{TIMELINE_END}}": sowData.timeline?.endDate || "",
            //"{{WORK_DESCRIPTION}}": sowData.workDescription || "",
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

        // Update document with replacements
        try {
            await docs.documents.batchUpdate({
                documentId: newDocId,
                requestBody: { requests },
            });
        } catch (error) {
            console.error("Error updating document:", error);
            // Attempt to delete the created document to avoid orphans
            try {
                await drive.files.delete({
                    fileId: newDocId,
                    supportsAllDrives: true,
                });
            } catch (deleteError) {
                console.error(
                    "Failed to cleanup document after update error:",
                    deleteError,
                );
            }
            throw new Error(`Failed to update SOW document: ${error.message}`);
        }

        if (sowData.workDescription) {
            try {
                await replaceWithFormattedMarkdown(
                    docs,
                    newDocId,
                    "{{WORK_DESCRIPTION}}",
                    sowData.workDescription,
                );
            } catch (error) {
                console.error("Error applying markdown formatting:", error);
                // Fallback to plain text if formatting fails
                await docs.documents.batchUpdate({
                    documentId: newDocId,
                    requestBody: {
                        requests: [
                            {
                                replaceAllText: {
                                    containsText: {
                                        text: "{{WORK_DESCRIPTION}}",
                                        matchCase: true,
                                    },
                                    replaceText: sowData.workDescription,
                                },
                            },
                        ],
                    },
                });
            }
        } else {
            // Remove placeholder if no description
            await docs.documents.batchUpdate({
                documentId: newDocId,
                requestBody: {
                    requests: [
                        {
                            replaceAllText: {
                                containsText: {
                                    text: "{{WORK_DESCRIPTION}}",
                                    matchCase: true,
                                },
                                replaceText: "",
                            },
                        },
                    ],
                },
            });
        }

        // Set permissions
        try {
            await drive.permissions.create({
                fileId: newDocId,
                supportsAllDrives: true,
                requestBody: {
                    role: "writer",
                    type: "anyone",
                },
            });
        } catch (error) {
            console.error("Error setting permissions:", error);
            // Don't throw here - document is created, just permissions failed
            console.warn(
                "Document created but permissions could not be set. Continuing...",
            );
        }

        const docUrl = `https://docs.google.com/document/d/${newDocId}/edit`;

        let success = false;
        if(newDocId) {
            success = true;
        }

        return { docId: newDocId, docUrl, success };
    } catch (error) {
        console.error("Error in createSowDocument:", error);

        // Re-throw with context if it's already our custom error
        if (error.message.includes("Failed to")) {
            throw error;
        }

        // Otherwise wrap in a generic error
        throw new Error(`Unable to create SOW document: ${error.message}`);
    }
};

module.exports = { createSowDocument };
