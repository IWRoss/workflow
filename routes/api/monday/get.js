const express = require("express");
const router = express.Router();

const {
    getMondayBoard,
    getMondayMembers,
} = require("../../../controllers/monday");

// Get a specific board by ID
router.get("/monday/boards/:boardId", async (req, res) => {
    try {
        const board = await getMondayBoard(req.params.boardId);
        res.json(board);
    } catch (error) {
        console.error("Error fetching board:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get Monday members
router.get("/monday/members", async (req, res) => {
    try {
        const members = await getMondayMembers();
        res.json(members);
    } catch (error) {
        console.error("Error fetching members:", error);
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;