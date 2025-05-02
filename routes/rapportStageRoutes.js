// routes/rapportStageRoutes.js
const express = require("express");
const router = express.Router();
const rapportStageController = require("../controllers/rapportStageController");
const auth = require("../middlewares/checkToken");
const upload = require("../middlewares/upload");

// Appliquer auth à toutes les routes
router.use(auth);

// Soumission d’un rapport (fichier PDF/DOCX)
router.post("/submit", upload.single("rapport"), rapportStageController.submitReport);

// Validation ou ajout d’un commentaire
router.post("/validate", rapportStageController.validateReport);
router.post("/commenter", rapportStageController.commenterRapport);

// Liste des rapports assignés à l'encadrant connecté
router.get("/mes-rapports", rapportStageController.getRapportsEncadrant);

// Récupération des commentaires d’un rapport
router.get("/commentaires/:rapportId", rapportStageController.getCommentairesRapport);

// Vérification automatique : rapport non soumis à temps
router.get("/verifier-soumission", rapportStageController.verifierSoumissionRapportEtudiant);

// Vérification automatique : validation en retard → rediriger vers tier
router.get("/verifier-validation", rapportStageController.verifierValidationEncadrantsEtAffecterTier);

module.exports = router;
