const express = require("express");
const router = express.Router();
const stageController = require("../controllers/stageController");
const auth = require("../middlewares/checkToken");

// Middleware d'authentification pour toutes les routes
router.use(auth);

//  Proposition et validation de stage
router.post("/proposeStage", stageController.proposeStage);
router.post("/validate-sujet", stageController.validateSujet);

//  Informations du stage
router.get("/current", stageController.getCurrentStage);

//  Propositions en attente (dashboards des encadrants)
router.get("/propositions/academique", stageController.getPropositionsAca);
router.get("/propositions/professionnel", stageController.getPropositionsPro);

//  Encadrements (dashboards)
router.get("/encadrements/academique", stageController.getEncadrementsAca);
router.get("/encadrements/professionnel", stageController.getEncadrementsPro);

//  Notifications de l'utilisateur connecté
router.get("/notifications", stageController.getNotifications);

module.exports = router;
