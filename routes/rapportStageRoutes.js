const express = require("express");
const router = express.Router();
const rapportController = require("../controllers/rapportStageController");
const upload = require("../middlewares/upload");
const checkToken = require("../middlewares/checkToken");

//  Étudiant : soumettre un rapport de stage (PDF + cibles)
router.post("/soumettre", checkToken, upload.single("fichier"), rapportController.submitRapport);

//  Encadrant : valider un rapport
router.post("/valider", checkToken, rapportController.validateRapport);

//  Tier : valider à la place de l'encadrant (en cas de retard)
router.post("/valider-tier", checkToken, rapportController.validateByTier);

// Encadrant : commenter un rapport
router.post("/comment", checkToken, rapportController.commentRapport);

//  Étudiant : consulter les commentaires reçus
router.get("/commentaires/:rapportId", checkToken, rapportController.getCommentaires);

//  Encadrant : récupérer les rapports à valider (en fonction du rôle connecté)
router.get("/encadrant", checkToken, rapportController.getRapportsAValider);

// Étudiant : consulter tous ses rapports soumis
router.get("/mes-rapports", checkToken, rapportController.getMesRapports);
//
// Étudiant : consulter tous ses rapports soumis (et déclencher rappel automatique si applicable)
router.get("/mes-rapports", checkToken, rapportController.getMesRapports);



module.exports = router;
