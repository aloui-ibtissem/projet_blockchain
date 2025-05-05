const attestationService = require("../services/attestationService");

exports.uploadAttestation = async (req, res) => {
  try {
    const { etudiantId, identifiantStage, responsableEntrepriseEmail } = req.body;
    const fichier = req.file;

    const result = await attestationService.uploadAndSignAttestation({
      fichier,
      etudiantId,
      identifiantStage,
      responsableEntrepriseEmail
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Erreur uploadAttestation:", error);
    res.status(500).json({ error: "Erreur lors de l’upload de l’attestation." });
  }
};

exports.validateOnChain = async (req, res) => {
  // Optionnel si tu veux une validation "à part" du responsable universitaire.
  res.status(200).json({ message: "Validation on-chain intégrée dans upload." });
};
