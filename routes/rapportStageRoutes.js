const express = require('express');
const router = express.Router();
const rapportController = require('../controllers/rapportStageController');
const verifyToken = require('../middlewares/verifyToken');

// Routes spécifiques pour Tier Université
router.get('/tierUni/rapports-en-retard', verifyToken, rapportController.getRapportsEnRetardUni);
router.post('/tierUni/valider-rapport', verifyToken, rapportController.validerRapportUni);

// Routes spécifiques pour Tier Entreprise
router.get('/tierEnt/rapports-en-retard', verifyToken, rapportController.getRapportsEnRetardEnt);
router.post('/tierEnt/valider-rapport', verifyToken, rapportController.validerRapportEnt);

module.exports = router;
