const attestationService = require("../services/attestationService");

exports.genererAttestation = async (req, res) => {
  try {
    const { appreciation, responsableNom, lieu, headerText, signature, logoPath } = req.body;
    const { id: responsableId } = req.user;
    const { stageId } = req.params;

    const { hash, ipfsUrl, identifiant } = await attestationService.genererAttestation({
      stageId,
      responsableId,
      appreciation,
      modifs: {
        responsableNom,
        lieu,
        headerText,
        signature,
        logoPath
      }
    });

    res.status(200).json({
      message: "Attestation générée",
      hash,
      ipfsUrl,
      identifiant
    });
  } catch (err) {
    console.error("Erreur attestation:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.verifierAttestation = async (req, res) => {
  try {
    const { identifiant } = req.params;
    const result = await attestationService.verifierAttestation(identifiant);
    res.status(200).json(result);
  } catch (err) {
    console.error("Erreur vérification attestation :", err);
    res.status(404).json({ error: err.message });
  }
};
