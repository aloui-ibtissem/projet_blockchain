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


// Tier : récupérer les rapports à valider après dépassement de délai
router.get("/tier/rapports-assignes", checkToken, rapportController.getRapportsPourTier);

// Historique des actions pour un utilisateur (filtrable par origine)
router.get("/historique/:id/:role", checkToken, rapportController.getHistoriqueUtilisateur);

//
router.get("/entreprise/valides", checkToken, rapportController.getRapportsValidésPourEntreprise);


module.exports = router;
