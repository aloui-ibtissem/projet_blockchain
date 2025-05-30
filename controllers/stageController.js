// stageController.js
const stageService = require("../services/stageService");
const db = require("../config/db");

exports.proposerStage = async (req, res) => {
  try {
    const {
      sujet,
      objectifs,
      dateDebut,
      dateFin,
      encadrantAcademique,
      encadrantProfessionnel
    } = req.body;

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
    console.error("Erreur dans proposerStage :", err);
    res.status(500).json({ error: err.message });
  }
};

exports.validerSujet = async (req, res) => {
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

    res.status(200).json({ message: `Sujet ${action === 'accepter' ? 'accepté' : 'refusé'} avec succès.` });
  } catch (err) {
    console.error("Erreur dans validerSujet :", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getPropositions = async (req, res) => {
  try {
    const type = req.user.role === "EncadrantAcademique" ? "academique" : "professionnel";
    const email = req.user.email;

    const result = await stageService.getPropositionsEncadrant(type, email);
    res.json(result);
  } catch (err) {
    console.error("Erreur dans getPropositions :", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getEncadrements = async (req, res) => {
  try {
    const type = req.user.role === "EncadrantAcademique" ? "academique" : "professionnel";
    const email = req.user.email;

    const result = await stageService.getEncadrements(type, email);
    res.json(result);
  } catch (err) {
    console.error("Erreur dans getEncadrements :", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCurrentStage = async (req, res) => {
  try {
    const stage = await stageService.getCurrentStageByEmail(req.user.email);
    if (!stage) return res.status(404).json({ error: "Aucun stage trouvé." });
    res.json(stage);
  } catch (err) {
    console.error("Erreur dans getCurrentStage :", err);
    res.status(500).json({ error: err.message });
  }
};

exports.rechercherParIdentifiant = async (req, res) => {
  try {
    const identifiant = req.params.identifiant;
    const [result] = await db.execute("SELECT * FROM Stage WHERE identifiant_unique = ?", [identifiant]);
    if (result.length === 0) return res.status(404).json({ error: "Stage introuvable." });
    res.json(result[0]);
  } catch (err) {
    console.error("Erreur rechercherParIdentifiant :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { id, role } = req.user;
    if (!id || !role) throw new Error("Utilisateur non authentifié correctement.");

    const [rows] = await db.execute(`
      SELECT id, message, date_envoi, est_lu
      FROM notifications
      WHERE destinataire_id = ? AND destinataire_type = ?
      ORDER BY date_envoi DESC
    `, [id, role.toLowerCase()]);

    res.status(200).json(rows);
  } catch (err) {
    console.error("Erreur getNotifications :", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getStageDetails = async (req, res) => {
const stageId = req.params.stageId;

  try {
    const [[stage]] = await db.execute(`
      SELECT S.id, S.identifiant_unique, S.dateDebut, S.dateFin, S.titre,
        E.prenom AS etudiantPrenom, E.nom AS etudiantNom, E.email AS etudiantEmail,
        EA.prenom AS acaPrenom, EA.nom AS acaNom,
        EP.prenom AS proPrenom, EP.nom AS proNom,
        ENT.nom AS entreprise
      FROM Stage S
      JOIN Etudiant E ON S.etudiantId = E.id
      JOIN EncadrantAcademique EA ON S.encadrantAcademiqueId = EA.id
      JOIN EncadrantProfessionnel EP ON S.encadrantProfessionnelId = EP.id
      JOIN Entreprise ENT ON S.entrepriseId = ENT.id
      WHERE S.id = ?
    `, [stageId]);

    if (!stage) return res.status(404).json({ error: "Stage non trouvé." });

    res.json(stage);
  } catch (err) {
    console.error("Erreur récupération stage:", err);
    res.status(500).json({ error: "Erreur interne serveur." });
  }
};

//
exports.getStagesHistoriques = async (req, res) => {
  try {
    const email = req.user.email;
    const stages = await stageService.getStagesHistoriquesByEmail(email);
    res.status(200).json(stages);
  } catch (err) {
    console.error("Erreur dans getStagesHistoriques :", err);
    res.status(500).json({ error: "Erreur interne serveur" });
  }
};

