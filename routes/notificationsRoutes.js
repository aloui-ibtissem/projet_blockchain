const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const checkToken = require("../middlewares/checkToken");

router.get("/mes", checkToken, notificationController.getMesNotifications);

module.exports = router;
