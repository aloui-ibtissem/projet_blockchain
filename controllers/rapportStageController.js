const rapportService = require("../services/rapportService");

exports.submitRapport = async (req, res) => {
  try {
    const token = req.user;
    const fichier = req.file;

    if (!fichier) return res.status(400).json({ error: "Aucun fichier reçu." });

    await rapportService.soumettreRapport(token.email, fichier);
    res.json({ message: "Rapport soumis avec succès." });
  } catch (err) {
    console.error("Erreur submitRapport:", err);
    res.status(500).json({ error: "Erreur lors de la soumission du rapport." });
  }
};

exports.validateRapport = async (req, res) => {
  try {
    const token = req.user;
    const { rapportId } = req.body;

    await rapportService.validerRapport(token.email, token.role, rapportId);
    res.json({ message: "Rapport validé." });
  } catch (err) {
    console.error("Erreur validateRapport:", err);
    res.status(500).json({ error: "Erreur lors de la validation du rapport." });
  }
};

exports.commentRapport = async (req, res) => {
  try {
    const token = req.user;
    const { rapportId, commentaire } = req.body;

    if (!commentaire || !rapportId) {
      return res.status(400).json({ error: "Champs requis manquants." });
    }

    await rapportService.commenterRapport(token.email, rapportId, commentaire);
    res.json({ message: "Commentaire enregistré." });
  } catch (err) {
    console.error("Erreur commentRapport:", err);
    res.status(500).json({ error: "Erreur lors de l'ajout du commentaire." });
  }
};

exports.getCommentaires = async (req, res) => {
  try {
    const { rapportId } = req.params;
    const commentaires = await rapportService.getCommentairesRapport(rapportId);
    res.json(commentaires);
  } catch (err) {
    console.error("Erreur getCommentaires:", err);
    res.status(500).json({ error: "Erreur récupération commentaires." });
  }
};

exports.getRapportsEncadrant = async (req, res) => {
  try {
    const token = req.user;
    const rapports = await rapportService.getRapportsAValider(token.email, token.role);
    res.json(rapports);
  } catch (err) {
    console.error("Erreur getRapportsEncadrant:", err);
    res.status(500).json({ error: "Erreur récupération rapports." });
  }
};

exports.getMesRapports = async (req, res) => {
  try {
    const token = req.user;
    const rapports = await rapportService.getMesRapports(token.email);
    res.json(rapports);
  } catch (err) {
    console.error("Erreur getMesRapports:", err);
    res.status(500).json({ error: "Erreur récupération rapports étudiant." });
  }
};
