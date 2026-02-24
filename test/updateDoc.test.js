require("dotenv").config();
const { createSowDocument } = require("../helpers/updateDoc");

const testSowData = {
    id: "test-123",
    projectCode: "TEST-001",
    projectName: "Test Project - Unit Test",
    client: "Test Client Ltd",
    clientEmail: "test@example.com",
    primaryContactId: "12345",
    timeline: {
        startDate: "2026-03-01",
        endDate: "2026-06-30",
    },
    workDescription:
        "This is a test SOW to verify Google Docs integration is working correctly.",
    teamMembers: "Jane Doe, John Smith, Bob Wilson",
    status: "Submitted",
    projectOwner: "U087XQSQUDV",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

const runTest = async () => {
    console.log("Starting createSowDocument test...\n");
    console.log("Test data:", JSON.stringify(testSowData, null, 2));
    console.log("\n---\n");

    try {
        console.log("Creating Google Doc from template...");
        const result = await createSowDocument(testSowData);

        console.log("\n Document created successfully!");
        console.log(`   Doc ID:  ${result.docId}`);
        console.log(`   Doc URL: ${result.docUrl}`);
        console.log(
            "\n Open the URL above to verify placeholders were replaced correctly.",
        );
    } catch (error) {
        console.error("\n Test failed!");
        console.error(`   Error: ${error.message}`);

        if (error.message.includes("not found")) {
            console.error(
                "\nCheck that GOOGLE_SOW_TEMPLATE_ID is correct in .env",
            );
        }
        if (error.message.includes("permission")) {
            console.error(
                "\nShare the template and folder with your service account:",
            );
            console.error(`   ${process.env.FIREBASE_CLIENT_EMAIL}`);
        }
        if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
            console.error(
                "\nMissing env variables: FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY",
            );
        }

        console.error("\nFull error:", error);
    }
};

runTest();