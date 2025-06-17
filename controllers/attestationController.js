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
    const responsableId = req.user.id;

    // Trouver l'entreprise associée à ce responsable
    const [[responsable]] = await db.execute(`
      SELECT entrepriseId FROM ResponsableEntreprise WHERE id = ?
    `, [responsableId]);

    if (!responsable) {
      return res.status(404).json({ error: "Responsable non trouvé" });
    }

    const entrepriseId = responsable.entrepriseId;

    // Sélectionner les stages avec attestationGeneree = TRUE mais pas encore générée (pas dans table Attestation)
    const [rows] = await db.execute(`
      SELECT s.id AS stageId, s.titre, e.prenom, e.nom, e.email,
             ea.prenom AS acaPrenom, ea.nom AS acaNom,
             ep.prenom AS proPrenom, ep.nom AS proNom,
             r.identifiantRapport
      FROM Stage s
      JOIN RapportStage r ON r.stageId = s.id
      JOIN Etudiant e ON s.etudiantId = e.id
      JOIN EncadrantAcademique ea ON s.encadrantAcademiqueId = ea.id
      JOIN EncadrantProfessionnel ep ON s.encadrantProfessionnelId = ep.id
      LEFT JOIN Attestation a ON a.stageId = s.id
      WHERE s.entrepriseId = ?
        AND r.attestationGeneree = TRUE
        AND a.id IS NULL
    `, [entrepriseId]);

    res.status(200).json(rows);
  } catch (err) {
    console.error("Erreur getAttestationsAGenerer:", err);
    res.status(500).json({ error: err.message });
  }
};
