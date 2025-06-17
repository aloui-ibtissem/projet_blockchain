const express = require("express");
const router = express.Router();
const attestationController = require("../controllers/attestationController");
const checkToken = require("../middlewares/checkToken");

// Middleware pour vérifier que l'utilisateur est un ResponsableEntreprise
const requireResponsableEntreprise = async (req, res, next) => {
  await checkToken(req, res, async () => {
    if (req.user.role !== "ResponsableEntreprise") {
      return res.status(403).json({ error: "Accès refusé. Rôle requis : ResponsableEntreprise" });
    }
    next();
  });
};

// Middleware pour vérifier que l'utilisateur est un ResponsableUniversitaire
const requireResponsableUniversitaire = async (req, res, next) => {
  await checkToken(req, res, async () => {
    if (req.user.role !== "ResponsableUniversitaire") {
      return res.status(403).json({ error: "Accès refusé. Rôle requis : ResponsableUniversitaire" });
    }
    next();
  });
};

// Générer une attestation (par ResponsableEntreprise)
router.post("/generer/:stageId", requireResponsableEntreprise, attestationController.genererAttestation);


// Vérification publique (via QR code ou lien)
router.get("/verifier/:identifiant", attestationController.verifierAttestation);

// Attestation de l'étudiant connecté
router.get("/etudiant/ma-attestation", checkToken, attestationController.attestationEtudiant);

// Liste des attestations de l'université (par ResponsableUniversitaire)
router.get("/attestations/universite", requireResponsableUniversitaire, attestationController.getAttestationsUniversite);

// Validation d'un stage (par ResponsableUniversitaire)
router.post("/valider-stage/:stageId", requireResponsableUniversitaire, attestationController.validerStageUniversite);

// Téléchargement de l'attestation (optionnel)
router.get("/download", checkToken, attestationController.downloadAttestation);

module.exports = router;
