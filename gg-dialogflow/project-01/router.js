const express = require("express");
const router = express.Router();

const controller = require("@/project-01/controller");

router.post("/webhook", controller.handleWebhook);
console.log("Project-01 is Loaded!");

module.exports = router;