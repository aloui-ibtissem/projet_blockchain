const attestationService = require("../services/attestationService");
const db = require("../config/db");

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
    const [rows] = await db.execute(`
      SELECT A.identifiant, A.fileHash AS hash, A.ipfsUrl AS lienIPFS, 
             S.identifiant_unique AS identifiantStage, 
             E.nom AS etudiantNom
      FROM Attestation A
      JOIN Stage S ON A.stageId = S.id
      JOIN Etudiant E ON A.etudiantId = E.id
      WHERE A.identifiant = ?
    `, [identifiant]);

    if (!rows.length) {
      return res.status(404).json({ error: "Attestation introuvable" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Erreur vérification attestation:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.attestationEtudiant = async (req, res) => {
  try {
    const etudiantId = req.user.id;
    const [[attestation]] = await db.execute(
      "SELECT * FROM Attestation WHERE etudiantId = ? ORDER BY dateCreation DESC LIMIT 1",
      [etudiantId]
    );

    if (!attestation) {
      return res.status(404).json({ error: "Aucune attestation trouvée" });
    }

    res.status(200).json({
      attestationUrl: attestation.ipfsUrl,
      hash: attestation.fileHash,
      identifiant: attestation.identifiant
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAttestationsUniversite = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    if (role !== "ResponsableUniversitaire") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const data = await attestationService.getAttestationsByUniversite(userId);
    res.status(200).json(data);
  } catch (err) {
    console.error("Erreur lors de la récupération des attestations:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.validerStageUniversite = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { stageId } = req.params;

    if (role !== "ResponsableUniversitaire") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    await attestationService.validerParUniversite(stageId, userId);

    res.status(200).json({ message: "Stage validé et archivé avec succès." });
  } catch (err) {
    console.error("Erreur backend lors de la validation du stage :", err);
    res.status(500).json({ error: err.message });
  }
};

exports.downloadAttestation = async (req, res) => {
  try {
    const filePath = `/attestations/${req.user.id}.pdf`; 
    res.download(filePath);
  } catch (err) {
    console.error("Erreur téléchargement attestation:", err);
    res.status(500).json({ error: "Erreur serveur lors du téléchargement" });
  }
};
