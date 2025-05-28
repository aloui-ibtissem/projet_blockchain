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
    const { id } = req.user;
    const { rapportId } = req.body;

    await rapportService.validerParTier(rapportId, id);
    res.status(200).json({ message: "Rapport validé par le tier." });
  } catch (err) {
    console.error("Erreur validateByTier:", err);
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

