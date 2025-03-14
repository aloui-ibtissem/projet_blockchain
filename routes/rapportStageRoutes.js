const express = require('express');
const router = express.Router();
const rapportStageController = require('../controllers/rapportStageController');

router.post('/rapports', rapportStageController.soumettreRapport);

module.exports = router;
