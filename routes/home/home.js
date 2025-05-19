const express = require("express"),
  router = express.Router();

const path = require("path");

router.get("*", (req, res) => {
  // Return something if it's live
  res.send("Hello world");
});
