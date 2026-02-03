require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");

const PORT = process.env.PORT || 4000;

// Express is our web server
const app = express();

const server = require("http").createServer(app);

// Enable CORS for all routes
app.use(cors());


// Parse requests of content-type - application/json
const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
        req.rawBody = buf.toString(encoding || "utf8");
    }
};

app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));

// Import routes
const apiRoutes = require("./routes/api/api");
const copperRoutes = require("./routes/api/copper/get");
const mondayRoutes = require("./routes/api/monday/get");
const googleAuthRoutes = require("./routes/api/googleAuth/post");


// Use routes
app.use(apiRoutes);
app.use(copperRoutes);
app.use(mondayRoutes);
app.use('/googleAuth', googleAuthRoutes);
// app.get("*", (req, res) => {
//     res.status(200).json({
//         status: "ok",
//         timestamp: new Date().toISOString(),
//         uptime: process.uptime(),
//         service: "workflow",
//     });
// });


// Serve Vite static files
app.use(express.static(path.join(__dirname, "client/frontend/dist")));

// Catch-all: serve React app for client-side routing
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/frontend/dist/index.html"));
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
