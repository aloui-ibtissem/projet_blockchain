const attestationService = require("../services/attestationService");

exports.genererAttestation = async (req, res) => {
  try {
    const { stageId, appreciation, modifs } = req.body;
    const responsableId = req.user.id;

    const result = await attestationService.genererAttestation({
      stageId,
      appreciation,
      modifs,
      responsableId
    });

    res.status(200).json({ message: "Attestation générée", ...result });
  } catch (err) {
    console.error("Erreur génération attestation", err);
    res.status(500).json({ error: err.message });
  }
};
