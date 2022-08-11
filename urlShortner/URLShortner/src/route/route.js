const express = require("express");
const router = express.Router();
const urlController = require("../controller/urlController");

router.post("/url/shorten", urlController.createUrl);

router.get("/:urlCode", urlController.getUrl);

module.exports = router;

// 2edb2bf8a6cd44238ddb2df25741a213
