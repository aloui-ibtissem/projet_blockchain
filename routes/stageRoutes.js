const express = require("express");
const router = express.Router();
const stageController = require("../controllers/stageController");
const checkToken = require("../middlewares/checkToken");

// Étudiant propose un sujet de stage
router.post("/proposer", checkToken, stageController.proposeStage);

// Encadrants valident ou refusent une proposition
router.post("/valider", checkToken, stageController.validateSujet);

// Encadrant académique : voir les propositions
router.get("/propositions/aca", checkToken, stageController.getPropositionsAca);

// Encadrant professionnel : voir les propositions
router.get("/propositions/pro", checkToken, stageController.getPropositionsPro);

// Encadrant académique : voir les stages encadrés
router.get("/encadrements/aca", checkToken, stageController.getEncadrementsAca);

// Encadrant professionnel : voir les stages encadrés
router.get("/encadrements/pro", checkToken, stageController.getEncadrementsPro);

// Étudiant : voir le stage en cours
router.get("/mon-stage", checkToken, stageController.getCurrentStage);

// Notifications dashboard
router.get("/notifications", checkToken, stageController.getNotifications);

// Recherche de stage par identifiant (ex: pour les responsables ou affichage public)
router.get("/recherche/:identifiant", checkToken, stageController.rechercherParIdentifiant);

module.exports = router;
