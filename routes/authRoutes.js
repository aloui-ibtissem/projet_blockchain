// authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/AuthController");
const verifyToken = require("../middlewares/checkToken");

// Routes d'authentification
router.post("/register-request", authController.register);
router.get("/verify/:token", authController.verifyEmailToken);
router.post("/login", authController.login);

// Route pour récupérer les infos du TierDébloqueur (structureType)
router.get("/tier/info", verifyToken, authController.getTierInfo);

module.exports = router;
