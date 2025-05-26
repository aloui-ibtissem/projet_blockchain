const express = require("express");
const router = express.Router();
const authController = require("../controllers/AuthController");
const verifyToken = require("../middlewares/checkToken");

router.post("/register-request", authController.register);
router.get("/verify-email/:token", authController.verifyEmailToken);
router.post("/login", authController.login);
router.get("/tier/info", verifyToken, authController.getTierInfo);

module.exports = router;
