const rapportService = require("../services/rapportService");

//  Soumettre un rapport
exports.submitRapport = async (req, res) => {
  try {
    const email = req.user.email;

    // Parser correctement les cibles envoyées depuis le frontend
    let cibles = [];
    if (req.body.cibles) {
      try {
        cibles = JSON.parse(req.body.cibles);
      } catch (e) {
        return res.status(400).json({ error: "Format de cibles invalide." });
      }
    }

    const result = await rapportService.soumettreRapport(email, req.file, cibles);
    res.status(200).json({ message: "Rapport soumis avec succès", result });
  } catch (err) {
    console.error("Erreur submitRapport:", err);
    res.status(500).json({ error: err.message });
  }
};

// Valider un rapport
exports.validateRapport = async (req, res) => {
  try {
    const { email, role } = req.user;
    const { rapportId } = req.body;

    await rapportService.validerRapport(email, role, rapportId);
    res.status(200).json({ message: "Rapport validé avec succès." });
  } catch (err) {
    console.error("Erreur validateRapport:", err);
    res.status(500).json({ error: err.message });
  }
};

// Ajouter un commentaire sur un rapport
exports.commentRapport = async (req, res) => {
  try {
    const { email } = req.user;
    const { rapportId, commentaire } = req.body;

    await rapportService.commenterRapport(email, rapportId, commentaire);
    res.status(200).json({ message: "Commentaire enregistré." });
  } catch (err) {
    console.error("Erreur commentRapport:", err);
    res.status(500).json({ error: err.message });
  }
};

// Validation par un tier
exports.validateByTier = async (req, res) => {
  try {
    const { rapportId } = req.body;
    const tierId = req.user.id; // récupéré via le token (grâce à middleware checkToken)

    await rapportService.validerParTier(rapportId, tierId);
    res.status(200).json({ message: "Validation par le tier effectuée." });
  } catch (err) {
    console.error("Erreur validation tier:", err);
    res.status(500).json({ error: err.message });
  }
};


//  Récupérer les rapports à valider pour l'encadrant
exports.getRapportsAValider = async (req, res) => {
  try {
    const { email, role } = req.user;
    const result = await rapportService.getRapportsAValider(email, role);
    res.status(200).json(result);
  } catch (err) {
    console.error("Erreur getRapportsAValider:", err);
    res.status(500).json({ error: err.message });
  }
};
//
exports.getMesRapports = async (req, res) => {
  try {
    const { email } = req.user;
    const rapports = await rapportService.getMesRapports(email);
    res.status(200).json(rapports);
  } catch (err) {
    console.error("Erreur getMesRapports:", err);
    res.status(500).json({ error: err.message });
  }
};


//
exports.getCommentaires = async (req, res) => {
  try {
    const { rapportId } = req.params;
    const [rows] = await db.execute(
      `SELECT commentaire, date_envoi 
       FROM CommentaireRapport 
       WHERE rapportId = ? 
       ORDER BY date_envoi DESC`,
      [rapportId]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Erreur getCommentaires:", err);
    res.status(500).json({ error: err.message });
  }
};
//
exports.getRapportsPourTier = async (req, res) => {
  try {
    const { id } = req.user; // ID du tier débloqueur connecté
    const result = await rapportService.getRapportsPourTier(id);
    res.status(200).json(result);
  } catch (err) {
    console.error("Erreur getRapportsPourTier:", err);
    res.status(500).json({ error: err.message });
  }
};
//
exports.getHistoriqueUtilisateur = async (req, res) => {
  const { id, role } = req.params;
  const origine = req.query.origine || null;

  try {
    const historique = await historiqueService.getHistoriqueParUtilisateur(parseInt(id), role, origine);
    res.json(historique);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//
exports.getRapportsByEncadrantAcademiqueEmail = async (req, res) => {
  const { email } = req.params;
  const [rows] = await db.execute(`
    SELECT rs.*, s.titre, e.nom AS etudiantNom, e.prenom AS etudiantPrenom
    FROM RapportStage rs
    JOIN Stage s ON s.id = rs.stageId
    JOIN EncadrantAcademique ea ON ea.id = s.encadrantAcademiqueId
    JOIN Etudiant e ON e.id = s.etudiantId
    WHERE ea.email = ?
    ORDER BY rs.dateSoumission DESC
  `, [email]);
  res.json(rows);
};

//
exports.getRapportsByEncadrantProfessionnelEmail = async (req, res) => {
  const { email } = req.params;
  const [rows] = await db.execute(`
    SELECT rs.*, s.titre, e.nom AS etudiantNom, e.prenom AS etudiantPrenom
    FROM RapportStage rs
    JOIN Stage s ON s.id = rs.stageId
    JOIN EncadrantProfessionnel ep ON ep.id = s.encadrantProfessionnelId
    JOIN Etudiant e ON e.id = s.etudiantId
    WHERE ep.email = ?
    ORDER BY rs.dateSoumission DESC
  `, [email]);
  res.json(rows);
};


