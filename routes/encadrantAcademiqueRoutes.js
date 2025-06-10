const express = require('express');
const controller = require('../controllers/encadrantacAdemiqueController');
const stageController = require('../controllers/stageController');
const rapportController = require('../controllers/rapportStageController');

const router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);


// Obtenir stages actuels et historiques encadrés par cet encadrant
router.get('/stages/:email', stageController.getStagesByEncadrantAcademiqueEmail);
//
router.get('/rapports/:id', controller.getRapportsEncadrantAcademique);

module.exports = router;



