const express = require("express"),
    router = express.Router();

const path = require("path");

router.get("*", (req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: "workflow",
    });
});
