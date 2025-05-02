const db = require("../config/db");
const stageService = require("../services/stageService");
const notificationService = require("../services/notificationService");

// 1. Proposer un stage
exports.proposeStage = async (req, res) => {
  try {
    const { sujet, objectifs, dateDebut, dateFin, encadrantAcademique, encadrantProfessionnel } = req.body;
    const etudiantEmail = req.user.email;

    await stageService.proposerSujet({
      sujet,
      objectifs,
      dateDebut,
      dateFin,
      encadrantAcademique,
      encadrantProfessionnel,
      etudiantEmail
    });

    res.json({ success: true });
  } catch (err) {
    console.error("proposeStage error:", err);
    res.status(500).json({ error: "Erreur lors de la proposition de stage." });
  }
};

// 2. Valider ou rejeter un sujet
exports.validateSujet = async (req, res) => {
  try {
    const { sujetId, action, commentaire } = req.body;
    const { email, role } = req.user;

    await stageService.validerOuRejeterSujet({
      sujetId,
      action,
      commentaire,
      email,
      role
    });

    res.json({ success: true });
  } catch (err) {
    console.error("validateSujet error:", err);
    res.status(500).json({ error: "Erreur lors de la validation du sujet." });
  }
};

// 3. Liste des encadrements pour le dashboard (Aca ou Pro)
exports.getEncadrementsAca = async (req, res) => {
  try {
    const result = await stageService.getEncadrements(req.user, "academique", db);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Erreur chargement encadrements académiques." });
  }
};

exports.getEncadrementsPro = async (req, res) => {
  try {
    const result = await stageService.getEncadrements(req.user, "professionnel", db);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Erreur chargement encadrements professionnels." });
  }
};

// 4. Notifications de l'utilisateur connecté
exports.getNotifications = async (req, res) => {
  try {
    const result = await notificationService.getUserNotifications(req.user, db);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Erreur chargement notifications." });
  }
};

// 5. Propositions en attente à afficher dans les dashboards encadrants
exports.getPropositionsAca = async (req, res) => {
  try {
    const result = await stageService.getPropositions(req.user, "academique", db);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Erreur chargement propositions académiques." });
  }
};

exports.getPropositionsPro = async (req, res) => {
  try {
    const result = await stageService.getPropositions(req.user, "professionnel", db);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Erreur chargement propositions professionnelles." });
  }
};

// 6. Infos du stage en cours (dashboard étudiant)
exports.getCurrentStage = async (req, res) => {
  try {
    const result = await stageService.getCurrentStage(req.user, db);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération du stage." });
  }
};
