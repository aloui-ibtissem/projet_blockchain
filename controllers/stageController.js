const stageService = require("../services/stageService");
const db = require("../config/db");

/**
 * Proposer un sujet de stage (étudiant)
 */
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
    res.status(200).json({ message: "Sujet de stage proposé avec succès." });
  } catch (err) {
    console.error("Erreur proposeStage:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Valider ou rejeter un sujet (encadrant)
 */
exports.validateSujet = async (req, res) => {
  try {
    const { sujetId, action, commentaire } = req.body;
    const { email, role } = req.user;
    await stageService.validerOuRejeterSujet({ sujetId, action, commentaire, email, role });
    res.status(200).json({ message: `Sujet ${action === 'accepter' ? 'accepté' : 'refusé'} avec succès.` });
  } catch (err) {
    console.error("Erreur validateSujet:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Propositions à valider pour encadrant académique
 */
exports.getPropositionsAca = async (req, res) => {
  try {
    const propositions = await stageService.getPropositionsEncadrant("academique", req.user.email);
    res.status(200).json(propositions);
  } catch (err) {
    console.error("Erreur getPropositionsAca:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Propositions à valider pour encadrant professionnel
 */
exports.getPropositionsPro = async (req, res) => {
  try {
    const propositions = await stageService.getPropositionsEncadrant("professionnel", req.user.email);
    res.status(200).json(propositions);
  } catch (err) {
    console.error("Erreur getPropositionsPro:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Encadrements pour encadrant académique
 */
exports.getEncadrementsAca = async (req, res) => {
  try {
    const stages = await stageService.getEncadrements("academique", req.user.email);
    res.status(200).json(stages);
  } catch (err) {
    console.error("Erreur getEncadrementsAca:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Encadrements pour encadrant professionnel
 */
exports.getEncadrementsPro = async (req, res) => {
  try {
    const stages = await stageService.getEncadrements("professionnel", req.user.email);
    res.status(200).json(stages);
  } catch (err) {
    console.error("Erreur getEncadrementsPro:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Récupérer le stage actuel d’un étudiant connecté
 */
exports.getCurrentStage = async (req, res) => {
  try {
    const stage = await stageService.getCurrentStageByEmail(req.user.email);
    res.status(200).json(stage);
  } catch (err) {
    console.error("Erreur getCurrentStage:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Notifications (dashboard)
 */
exports.getNotifications = async (req, res) => {
  try {
    const { id, role } = req.user;
    if (!id || !role) throw new Error("Utilisateur non authentifié correctement.");
    const [rows] = await db.execute(
      `SELECT id, message, date_envoi, est_lu FROM notifications
       WHERE destinataire_id = ? AND destinataire_type = ?
       ORDER BY date_envoi DESC`,
      [id, role.toLowerCase()]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Erreur getNotifications:", err);
    res.status(500).json({ error: err.message });
  }
};
//
exports.rechercherParIdentifiant = async (req, res) => {
  try {
    const identifiant = req.params.identifiant;
    const [result] = await db.execute("SELECT * FROM Stage WHERE identifiant_unique = ?", [identifiant]);
    if (result.length === 0) return res.status(404).json({ error: "Stage introuvable." });
    res.json(result[0]);
  } catch (err) {
    console.error("Erreur rechercherParIdentifiant:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
