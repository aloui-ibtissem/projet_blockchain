const express = require('express');
const controller = require('../controllers/encadrantProfessionnelController');
const stageController = require('../controllers/stageController');
const rapportController = require('../controllers/rapportStageController');
const EncadrantProfessionnel = require('../models/EncadrantProfessionnel');

const router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

router.get('/stages/:email', stageController.getStagesByEncadrantProfessionnelEmail);
//
router.get('/rapports/:id', controller.getRapportsEncadrantProfessionnel);

module.exports = router;
