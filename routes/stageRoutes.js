const express = require("express");
const router = express.Router();
const stageController = require("../controllers/stageController");
const auth = require("../middlewares/checkToken");

router.use(auth);

// Proposition et validation
router.post("/proposeStage", stageController.proposeStage);
router.post("/validate-sujet", stageController.validateSujet);

// Dashboards
router.get("/propositions/academique", stageController.getPropositionsAca);
router.get("/propositions/professionnel", stageController.getPropositionsPro);

router.get("/encadrements/academique", stageController.getEncadrementsAca);
router.get("/encadrements/professionnel", stageController.getEncadrementsPro);

// Notifications
router.get("/notifications", stageController.getNotifications);

// Étudiant : stage en cours
router.get("/current", stageController.getCurrentStage);

module.exports = router;
