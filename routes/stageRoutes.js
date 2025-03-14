const express = require('express');
const router = express.Router();
const stageController = require('../controllers/stageController');

router.post('/stages', stageController.creerStage);

module.exports = router;
