require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const PORT = process.env.PORT || 4000;

// Express is our web server
const app = express();
const server = require("http").createServer(app);

// Parse requests of content-type - application/json
const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
        req.rawBody = buf.toString(encoding || "utf8");
    }
};

app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));

// Serve static files from React build in production
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "client/build")));
}

// Import routes
const apiRoutes = require("./routes/api/api");

// Use routes
app.post("*", apiRoutes);

// Handle React routing - catch all GET requests
app.get("*", (req, res) => {
    if (process.env.NODE_ENV === "production") {
        // Serve React app in production
        res.sendFile(path.join(__dirname, "client/build", "index.html"));
    } else {
        // Development API response
        res.status(200).json({
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            service: "workflow",
        });
    }
});

// Start the server
server.listen(PORT, function () {
    console.log("listening on port 4000");
});

/**
 * If any Slack events need to be run on app initialisation, run them here
 */
const { addWorkflowInterfaceToSlack } = require("./controllers/slack");

addWorkflowInterfaceToSlack();

const { setupCopperWebhook } = require("./controllers/copper");

setupCopperWebhook();

console.log("Server started");
