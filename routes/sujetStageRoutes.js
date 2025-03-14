const express = require('express');
const router = express.Router();
const sujetStageController = require('../controllers/sujetStageController');

router.post('/sujets', sujetStageController.creerSujet);

module.exports = router;
