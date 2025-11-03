const express = require("express"),
    router = express.Router();

const path = require("path");

// BetterStack pulse check endpoint
router.get("/pulse", (req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: "workflow",
    });
});

router.get("*", (req, res) => {
    // Return something if it's live
    res.send("Hello world");
});
