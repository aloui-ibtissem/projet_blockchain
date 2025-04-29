const express = require("express");
const router = express.Router();
const authController = require("../controllers/AuthController");

// Routes d'authentification
router.post("/register-request", authController.register);
router.get("/verify/:token", authController.verifyEmailToken);
router.post("/login", authController.login);

module.exports = router;
