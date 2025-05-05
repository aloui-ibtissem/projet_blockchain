const express = require("express");
const router = express.Router();
const rapportController = require("../controllers/rapportStageController");
const auth = require("../middlewares/checkToken");
const multer = require("multer");

// Configuration du stockage pour le fichier rapport
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Authentification requise pour toutes les routes
router.use(auth);

// Soumettre un rapport
router.post("/submit", upload.single("fichier"), rapportController.submitReport);

// Valider un rapport
router.post("/validate", rapportController.validateReport);

// Commenter un rapport
router.post("/comment", rapportController.commenterRapport);

// Voir les rapports à valider
router.get("/encadrant", rapportController.getRapportsAValider);

// Voir les commentaires sur un rapport
router.get("/commentaires/:rapportId", rapportController.getCommentaires);

module.exports = router;
