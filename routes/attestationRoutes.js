// routes/attestationRoutes.js
const express = require("express");
const router = express.Router();
const attestationController = require("../controllers/attestationController");
const checkToken = require("../middlewares/checkToken");

//vérifier user connecté et a bien role de responsable entreprise
const requireResponsableEntreprise = async (req, res, next) => {
  await checkToken(req, res, async () => {
    if (req.user.role !== "ResponsableEntreprise") {
      return res.status(403).json({ error: "Accès refusé. Rôle requis : ResponsableEntreprise" });
    }
    next();
  });
};

// Génération d'attestation
router.post("/generer/:stageId", requireResponsableEntreprise, attestationController.genererAttestation);

// Vérification publique (via QR ou lien)
router.get("/verifier/:identifiant", attestationController.verifierAttestation);
//
router.get("/etudiant/ma-attestation", checkToken, attestationController.attestationEtudiant);
//resp univ 
// routes/attestationRoutes.js
router.get(
  "/attestations/universite",
  checkToken,
  attestationController.getAttestationsUniversite
);
//
router.post("/valider-stage/:stageId", checkToken, attestationController.validerStageUniversite);

//
// Route pour permettre le téléchargement de l'attestation
router.get('/download', checkToken, attestationController.downloadAttestation);



module.exports = router;
