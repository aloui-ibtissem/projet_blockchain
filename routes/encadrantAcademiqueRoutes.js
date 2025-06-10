const express = require('express');
const controller = require('../controllers/encadrantAcademiqueController');
const stageController = require('../controllers/stageController');
const rapportController = require('../controllers/rapportStageController');

const router = express.Router();


router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);




module.exports = router;



