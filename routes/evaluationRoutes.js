const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');

router.post('/evaluations', evaluationController.evaluerRapport);

module.exports = router;
