// controllers/rapportStageController.js
const db = require("../config/db");
const rapportService = require("../services/rapportService");
const notificationService = require("../services/notificationService");

// Soumission d’un rapport (soumission illimitée possible après commentaire)
exports.submitReport = async (req, res) => {
  try {
    const result = await rapportService.submitReport(req.user, req.file, db);
    res.json({ success: true, result });
  } catch (err) {
    console.error("submitReport error:", err);
    res.status(500).json({ error: "Erreur lors de la soumission du rapport." });
  }
};

// Validation d’un rapport par encadrant ou tier débloqueur
exports.validateReport = async (req, res) => {
  try {
    const result = await rapportService.validateReport(req.body, req.user, db);
    res.json({ success: true, result });
  } catch (err) {
    console.error("validateReport error:", err);
    res.status(500).json({ error: "Erreur lors de la validation du rapport." });
  }
};

// Ajout d’un commentaire sur un rapport
exports.commenterRapport = async (req, res) => {
  try {
    const result = await rapportService.commenterRapport(req.body, req.user, db);
    res.json({ success: true, result });
  } catch (err) {
    console.error("commenterRapport error:", err);
    res.status(500).json({ error: "Erreur lors de l'ajout du commentaire." });
  }
};

// Liste des rapports assignés à l'encadrant
exports.getRapportsEncadrant = async (req, res) => {
  try {
    const result = await rapportService.getRapportsEncadrant(req.user, db);
    res.json(result);
  } catch (err) {
    console.error("getRapportsEncadrant error:", err);
    res.status(500).json({ error: "Erreur chargement des rapports." });
  }
};

// Liste des commentaires d’un rapport
exports.getCommentairesRapport = async (req, res) => {
  try {
    const result = await rapportService.getCommentairesRapport(req.params.rapportId, db);
    res.json(result);
  } catch (err) {
    console.error("getCommentairesRapport error:", err);
    res.status(500).json({ error: "Erreur récupération des commentaires." });
  }
};

// Tâche de vérification automatique : Rapports non soumis 7 jours avant fin stage
exports.verifierSoumissionRapportEtudiant = async (req, res) => {
  try {
    const result = await rapportService.verifierSoumissionsTardives(db);
    res.json({ success: true, result });
  } catch (err) {
    console.error("verifierSoumissionRapportEtudiant error:", err);
    res.status(500).json({ error: "Erreur vérification soumission rapport." });
  }
};

// Tâche de vérification automatique : Réaffectation au tier débloqueur après 7 jours fin stage
exports.verifierValidationEncadrantsEtAffecterTier = async (req, res) => {
  try {
    const result = await rapportService.verifierEtRedirigerVersTier(db);
    res.json({ success: true, result });
  } catch (err) {
    console.error("verifierValidationEncadrantsEtAffecterTier error:", err);
    res.status(500).json({ error: "Erreur dans la réaffectation tier débloqueur." });
  }
};
