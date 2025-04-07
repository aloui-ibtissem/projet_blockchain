const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route d'enregistrement
router.post('/register', authController.registerUser);

// Route de connexion
router.post('/login', authController.loginUser);

module.exports = router;
