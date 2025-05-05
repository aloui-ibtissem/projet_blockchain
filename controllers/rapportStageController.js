const rapportService = require("../services/rapportService");
const db = require("../config/db");

/**
 * Étudiant soumet son rapport de stage
 */
exports.submitReport = async (req, res) => {
  try {
    const user = req.user;
    const file = req.file;

    const result = await rapportService.submitReport(user, file);
    res.status(200).json(result);
  } catch (err) {
    console.error("Erreur dans submitReport:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Validation par un encadrant ou un tier débloqueur
 */
exports.validateReport = async (req, res) => {
  try {
    const result = await rapportService.validateReport(req.body, req.user);
    res.status(200).json(result);
  } catch (err) {
    console.error("Erreur dans validateReport:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Encadrant ajoute un commentaire sur le rapport
 */
exports.commenterRapport = async (req, res) => {
  try {
    const result = await rapportService.commenterRapport(req.body);
    res.status(200).json(result);
  } catch (err) {
    console.error("Erreur dans commenterRapport:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Liste des rapports à valider (pour encadrants uniquement)
 */
exports.getRapportsAValider = async (req, res) => {
  try {
    const rapports = await rapportService.getRapportsEncadrant(req.user, db);
    res.status(200).json(rapports);
  } catch (err) {
    console.error("Erreur dans getRapportsAValider:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Récupération des commentaires liés à un rapport
 */
exports.getCommentaires = async (req, res) => {
  try {
    const { rapportId } = req.params;
    const commentaires = await rapportService.getCommentairesRapport(rapportId, db);
    res.status(200).json(commentaires);
  } catch (err) {
    console.error("Erreur dans getCommentaires:", err);
    res.status(500).json({ error: err.message });
  }
};
