require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

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

// Import routes
const apiRoutes = require("./routes/api/api");

// Use routes
app.post("*", apiRoutes);

// Start the server
server.listen(PORT, function () {
  console.log("listening on port 4000");
});

/**
 * If any Slack events need to be run on app initialisation, run them here
 */
const { addWorkflowInterfaceToSlack } = require("./controllers/slack");

addWorkflowInterfaceToSlack();
