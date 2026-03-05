const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
}

const db = admin.database();
const sowRef = db.ref("sow");

/**
 * POST /firebase/sow
 * Create a new SOW entry using the Copper Opportunity ID as the key
 */
router.post("/sow", async (req, res) => {
    try {
        const {
            id,
            projectOwner,
            projectCode,
            clientName,
            clientEmail,
            cost,
            primaryContactId,
            status,
            timelineStart,
            timelineEnd,
            projectName,
            client,
            workDescription,
                        teamMembers,
                        docId,

        } = req.body;

        // Validate required fields
        if (!id) {
            return res.status(400).json({ error: "Copper Opportunity ID is required" });
        }

        const sowData = {
            id,
            projectOwner: projectOwner || "",
            projectCode: projectCode || "",
            clientName: clientName || "",
            clientEmail: clientEmail || "",
            cost: cost != null ? String(cost) : "",
            primaryContactId: primaryContactId || "",
            status: status || "",
            timeline: {
                startDate: timelineStart || "",
                endDate: timelineEnd || "",
            },
            projectName: projectName || "",
            client: client || "",
            workDescription: workDescription || "",
            teamMembers: teamMembers || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
                docId: docId || "",

        };

        // Use the Copper Opportunity ID as the key
        await sowRef.child(id).set(sowData);

        res.status(201).json({
            success: true,
            message: "SOW created successfully",
            data: sowData,
        });
    } catch (error) {
        console.error("Error creating SOW:", error);
        res.status(500).json({ error: "Failed to create SOW" });
    }
});

/**
 * POST /firebase/sow/update
 * Update an existing SOW entry
 */
router.post("/sow/update", async (req, res) => {
    try {
        const { id, ...updates } = req.body;

        if (!id) {
            return res.status(400).json({ error: "Copper Opportunity ID is required" });
        }

        // Check if SOW exists
        const snapshot = await sowRef.child(id).once("value");
        if (!snapshot.exists()) {
            return res.status(404).json({ error: "SOW not found" });
        }

        // Build update object, only including provided fields
        const allowedFields = [
            "projectOwner",
            "projectCode",
            "clientName",
            "clientEmail",
            "cost",
            "primaryContactId",
            "status",
            "timelineStart",
            "timelineEnd",
            "projectName",
            "client",
            "workDescription",
            "teamMembers",
            "docId",
        ];

        const updateData = {};
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                if (field === "timelineStart") {
                    updateData["timeline/startDate"] = updates[field];
                } else if (field === "timelineEnd") {
                    updateData["timeline/endDate"] = updates[field];
                } else {
                    updateData[field] = updates[field];
                }
            }
        }

        updateData.updatedAt = new Date().toISOString();

        await sowRef.child(id).update(updateData);

        res.json({
            success: true,
            message: "SOW updated successfully",
        });
    } catch (error) {
        console.error("Error updating SOW:", error);
        res.status(500).json({ error: "Failed to update SOW" });
    }
});

/**
 * POST /firebase/sow/delete
 * Delete a SOW entry by Copper Opportunity ID
 */
router.post("/sow/delete", async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ error: "Copper Opportunity ID is required" });
        }

        const snapshot = await sowRef.child(id).once("value");
        if (!snapshot.exists()) {
            return res.status(404).json({ error: "SOW not found" });
        }

        await sowRef.child(id).remove();

        res.json({
            success: true,
            message: "SOW deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting SOW:", error);
        res.status(500).json({ error: "Failed to delete SOW" });
    }
});

module.exports = router;
