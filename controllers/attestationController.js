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

//
exports.downloadAttestation = async (req, res) => {
  try {
    const etudiantId = req.user.id;
    const [[attestation]] = await db.execute(
      "SELECT ipfsUrl FROM Attestation WHERE etudiantId = ? ORDER BY dateCreation DESC LIMIT 1",
      [etudiantId]
    );
    if (!attestation) return res.status(404).json({ error: "Aucune attestation trouvée" });

    return res.redirect(attestation.ipfsUrl); // Redirection directe vers le lien IPFS
  } catch (err) {
    console.error("Erreur téléchargement attestation:", err);
    res.status(500).json({ error: "Erreur serveur lors du téléchargement" });
  }
};

//
exports.getAttestationsAGenerer = async (req, res) => {
  try {
    const { id: responsableId } = req.user;

    const [[{ entrepriseId }]] = await db.execute(
      `SELECT entrepriseId FROM ResponsableEntreprise WHERE id = ?`,
      [responsableId]
    );

    const [rows] = await db.execute(`
      SELECT 
        S.id AS stageId,
        S.identifiant_unique AS identifiantStage,
        S.titre,
        E.prenom, E.nom, E.email,
        R.identifiantRapport
      FROM Stage S
      JOIN Etudiant E ON S.etudiantId = E.id
      JOIN RapportStage R ON R.stageId = S.id
      LEFT JOIN Attestation A ON A.stageId = S.id
      WHERE 
        S.entrepriseId = ?
        AND R.attestationGeneree = TRUE
        AND A.id IS NULL
    `, [entrepriseId]);

    res.status(200).json(rows);
  } catch (err) {
    console.error("Erreur getAttestationsAGenerer:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

//
exports.getAttestationsEntreprise = async (req, res) => {
  try {
    const [[{ entrepriseId }]] = await db.execute(
      "SELECT entrepriseId FROM ResponsableEntreprise WHERE email = ?",
      [req.user.email]
    );

    const [rows] = await db.execute(`
      SELECT A.identifiant, A.ipfsUrl, A.dateCreation,
             E.nom, E.prenom, S.titre
      FROM Attestation A
      JOIN Etudiant E ON A.etudiantId = E.id
      JOIN Stage S ON A.stageId = S.id
      WHERE S.entrepriseId = ?
      ORDER BY A.dateCreation DESC
    `, [entrepriseId]);

    res.json(rows);
  } catch (err) {
    console.error("Erreur getAttestationsEntreprise :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};
