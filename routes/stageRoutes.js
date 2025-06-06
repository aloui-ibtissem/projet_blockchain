const express = require("express");
const router = express.Router();
const stageController = require("../controllers/stageController");
const checkToken = require("../middlewares/checkToken");

//  Étudiant propose un sujet de stage
router.post("/proposer", checkToken, stageController.proposerStage);

//  Encadrant (académique ou professionnel) valide ou refuse
router.post("/valider", checkToken, stageController.validerSujet);

//  Propositions à valider (pour ACA ou PRO selon rôle connecté)
router.get("/propositions", checkToken, stageController.getPropositions);

//  Récupérer les stages encadrés
router.get("/encadrements", checkToken, stageController.getEncadrements);

//  Récupérer le stage en cours d’un étudiant connecté
router.get("/mon-stage", checkToken, stageController.getCurrentStage);

//  Rechercher un stage par identifiant unique (utile QR/public check)
router.get("/rechercher/:identifiant", stageController.rechercherParIdentifiant);

//  Notifications du tableau de bord
router.get("/notifications", checkToken, stageController.getNotifications);
//
// Détails complets d’un stage (utilisé pour préremplir formulaire attestation)
router.get("/details/:stageId", checkToken, stageController.getStageDetails);
//
router.get("/historique", checkToken, stageController.getStagesHistoriques);



module.exports = router;
