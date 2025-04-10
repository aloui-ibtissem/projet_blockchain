const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, authorize, hasPermission } = require('../middleware/authMiddleware');

// Route d'inscription (public)
router.post('/inscription', authController.inscription);

// Route de connexion (public)
router.post('/connexion', authController.connexion);

// Route de vérification du token (protégée)
router.get('/verifier-token', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token valide',
    user: req.user,
  });
});


// Route avec vérification de permissions spécifiques
router.get('/specific-permission', verifyToken, hasPermission('view_all_reports'), (req, res) => {
  res.status(200).json({ message: 'Vous avez les permissions nécessaires.' });
});

module.exports = router;