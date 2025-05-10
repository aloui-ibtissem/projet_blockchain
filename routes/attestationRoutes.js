const express = require("express");
const router = express.Router();
const attestationController = require("../controllers/attestationController");
const checkToken = require("../middlewares/checkToken");

// Vérifie que l'utilisateur est connecté et qu'il a le rôle "ResponsableEntreprise"
const requireResponsableEntreprise = async (req, res, next) => {
  await checkToken(req, res, async () => {
    if (req.user.role !== "ResponsableEntreprise") {
      return res.status(403).json({ error: "Accès refusé. Rôle requis : ResponsableEntreprise" });
    }
    next();
  });
};

// Route POST : Génération de l'attestation pour un stage (authentifiée)
router.post(
  "/generer/:stageId",
  requireResponsableEntreprise,
  attestationController.genererAttestation
);

// Route GET : Vérification publique d'une attestation à partir de son identifiant
router.get("/verifier/:identifiant", attestationController.verifierAttestation);

module.exports = router;
