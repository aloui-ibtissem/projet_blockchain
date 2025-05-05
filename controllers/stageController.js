const stageService = require("../services/stageService");
const db = require("../config/db");

exports.proposeStage = async (req, res) => {
  try {
    const { sujet, objectifs, dateDebut, dateFin, encadrantAcademique, encadrantProfessionnel } = req.body;
    const emailEtudiant = req.user.email;

    await stageService.proposerSujet({
      sujet, objectifs, dateDebut, dateFin,
      encadrantAcademique, encadrantProfessionnel,
      etudiantEmail: emailEtudiant
    });

    res.status(200).json({ message: "Proposition de stage envoyée." });
  } catch (err) {
    console.error("proposeStage:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.validateSujet = async (req, res) => {
  try {
    const { sujetId, action, commentaire } = req.body;
    const { email, role } = req.user;

    await stageService.validerOuRejeterSujet({ sujetId, action, commentaire, email, role });
    res.status(200).json({ message: `Sujet ${action} avec succès.` });
  } catch (err) {
    console.error("validateSujet:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCurrentStage = async (req, res) => {
  try {
    const { email } = req.user;
    const stage = await stageService.getCurrentStageByEmail(email);
    res.status(200).json(stage);
  } catch (err) {
    console.error("getCurrentStage:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getPropositionsAca = async (req, res) => {
  try {
    const propositions = await stageService.getPropositionsEncadrant("academique", req.user.email);
    res.status(200).json(propositions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPropositionsPro = async (req, res) => {
  try {
    const propositions = await stageService.getPropositionsEncadrant("professionnel", req.user.email);
    res.status(200).json(propositions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEncadrementsAca = async (req, res) => {
  try {
    const encadrements = await stageService.getEncadrements("academique", req.user.email);
    res.status(200).json(encadrements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEncadrementsPro = async (req, res) => {
  try {
    const encadrements = await stageService.getEncadrements("professionnel", req.user.email);
    res.status(200).json(encadrements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { id, role } = req.user;
    const [rows] = await db.execute(
      `SELECT id, message, date_envoi, est_lu FROM notifications
       WHERE destinataire_id = ? AND destinataire_type = ?
       ORDER BY date_envoi DESC`,
      [id, role.toLowerCase()]
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
