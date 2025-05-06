const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();
const attestationController = require("../controllers/attestationController");
const checkToken = require("../middlewares/checkToken");

// Génération attestation (Responsable entreprise)
router.post("/upload", checkToken, upload.single("fichier"), attestationController.uploadAttestation);

// Vérification/consultation (étudiant)
router.get("/voir", checkToken, attestationController.getAttestation);

module.exports = router;
