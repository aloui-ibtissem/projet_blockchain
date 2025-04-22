const express = require("express");
const router = express.Router();
const authController = require("../controllers/AuthController");

router.post("/register-request", authController.register);
router.get("/verify/:token", authController.verifyEmailToken);
router.post("/login", authController.login);
router.post("/reset-role", authController.resetRole);

module.exports = router;
