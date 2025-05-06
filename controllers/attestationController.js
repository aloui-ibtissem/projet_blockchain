const attestationService = require("../services/attestationService");

exports.uploadAttestation = async (req, res) => {
  try {
    const result = await attestationService.genererAttestation(req.user.email, req.file);
    res.json({ message: "Attestation générée avec succès.", ...result });
  } catch (error) {
    console.error("Erreur attestation:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAttestation = async (req, res) => {
  try {
    const attestation = await attestationService.getAttestationEtudiant(req.user.email);
    if (!attestation) return res.status(404).json({ message: "Aucune attestation." });

    const ipfsUrl = `https://ipfs.io/ipfs/${attestation.fichierHash}`;
    res.json({ attestationUrl: ipfsUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
