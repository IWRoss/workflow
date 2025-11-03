const express = require("express"),
    router = express.Router();

const path = require("path");

router.get("*", (req, res) => {
    // If pulse check, respond with status
    if (req.path === "/pulse") {
        res.status(200).json({
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            service: "workflow",
        });
        return;
    }

    // Return something if it's live
    res.send("Hello world");
});
