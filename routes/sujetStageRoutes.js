const express = require('express');
const router = express.Router();
const SujetStageController = require('../controllers/SujetStageController');

// Route pour proposer un sujet de stage
router.post('/proposer', SujetStageController.proposerSujetStage);

// Route pour gérer une proposition de sujet (accepter/refuser)
router.put('/gerer', SujetStageController.gererProposition);

module.exports = router;
