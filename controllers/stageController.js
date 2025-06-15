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

exports.getStagesHistoriques = async (req,res)=>{
  const search = req.query.search || "";
  const data   = await stageService.getStagesHistoriquesByEmail(
                   req.user.email,
                   search
                 );
  res.json(data);
};


//
exports.getStagiairesPourEncadrant = async (req, res) => {
  const email = req.user.email;
  const role = req.user.role;

  let encadrantQuery = '';
  if (role === 'EncadrantAcademique') {
    encadrantQuery = `SELECT id FROM EncadrantAcademique WHERE email = ?`;
  } else if (role === 'EncadrantProfessionnel') {
    encadrantQuery = `SELECT id FROM EncadrantProfessionnel WHERE email = ?`;
  } else {
    return res.status(403).json({ error: 'Rôle non autorisé' });
  }

  try {
    const [[encadrant]] = await db.execute(encadrantQuery, [email]);

    if (!encadrant || !encadrant.id) {
      return res.status(404).json({ error: "Encadrant introuvable dans la base." });
    }

    const encadrantId = encadrant.id;

    const [rows] = await db.execute(`
      SELECT
        S.id AS stageId,
        S.titre AS titreStage,
        S.identifiant_unique,
        S.dateDebut,
        S.dateFin,
        E.prenom,
        E.nom,
        E.email,
        R.identifiantRapport,
        R.fichier AS fichierRapport,
        A.identifiant AS attestationId,
        A.ipfsUrl
      FROM Stage S
      JOIN Etudiant E ON S.etudiantId = E.id
      LEFT JOIN RapportStage R ON R.stageId = S.id
      LEFT JOIN Attestation A ON A.stageId = S.id
      WHERE ${role === 'EncadrantAcademique' ? 'S.encadrantAcademiqueId' : 'S.encadrantProfessionnelId'} = ?
    `, [encadrantId]);

    res.json(rows);
  } catch (err) {
    console.error("Erreur dans getStagiairesPourEncadrant :", err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des stagiaires." });
  }
};



exports.getEncadrantsAcademiquesUniversite = async (req, res) => {
  const email = req.user.email;

  try {
    const [[{ universiteId }]] = await db.execute(
      "SELECT universiteId FROM ResponsableUniversitaire WHERE email = ?",
      [email]
    );

    const [rows] = await db.execute(`
      SELECT id, nom, prenom, email
      FROM EncadrantAcademique
      WHERE universiteId = ?
    `, [universiteId]);

    res.json(rows);
  } catch (err) {
    console.error("Erreur dans getEncadrantsAcademiquesUniversite :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};
exports.getStagiairesPourResponsableUniversitaire = async (req, res) => {
  const email = req.user.email;

  try {
    const [[{ universiteId }]] = await db.execute(
      "SELECT universiteId FROM ResponsableUniversitaire WHERE email = ?",
      [email]
    );

    const [rows] = await db.execute(`
      SELECT S.id AS stageId, S.titre, S.identifiant_unique,
             E.prenom, E.nom, R.identifiantRapport, R.fichier AS fichierRapport,
             A.identifiant AS attestationId, A.fichierHash, A.ipfsUrl
      FROM Stage S
      JOIN Etudiant E ON S.etudiantId = E.id
      LEFT JOIN RapportStage R ON R.stageId = S.id
      LEFT JOIN Attestation A ON A.stageId = S.id
      WHERE E.universiteId = ?
    `, [universiteId]);

    res.json(rows);
  } catch (err) {
    console.error("Erreur dans getStagiairesPourResponsableUniversitaire :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};
exports.getStagiairesPourResponsableEntreprise = async (req, res) => {
  const email = req.user.email;

  try {
    const [[{ entrepriseId }]] = await db.execute(
      "SELECT entrepriseId FROM ResponsableEntreprise WHERE email = ?",
      [email]
    );

    const [rows] = await db.execute(`
      SELECT S.id AS stageId, S.titre, S.identifiant_unique, S.dateDebut, S.dateFin,
             E.prenom, E.nom, E.email,
             R.identifiantRapport, R.fichier AS fichierRapport,
             A.identifiant AS attestationId, A.fichierHash, A.ipfsUrl
      FROM Stage S
      JOIN Etudiant E ON S.etudiantId = E.id
      LEFT JOIN RapportStage R ON R.stageId = S.id
      LEFT JOIN Attestation A ON A.stageId = S.id
      WHERE S.entrepriseId = ?
    `, [entrepriseId]);

    res.json(rows);
  } catch (err) {
    console.error("Erreur dans getStagiairesPourResponsableEntreprise :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

exports.getEncadrantsProfessionnelsEntreprise = async (req, res) => {
  const email = req.user.email;

  try {
    const [[{ entrepriseId }]] = await db.execute(
      "SELECT entrepriseId FROM ResponsableEntreprise WHERE email = ?",
      [email]
    );

    const [rows] = await db.execute(`
      SELECT id, nom, prenom, email
      FROM EncadrantProfessionnel
      WHERE entrepriseId = ?
    `, [entrepriseId]);

    res.json(rows);
  } catch (err) {
    console.error("Erreur dans getEncadrantsProfessionnelsEntreprise :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};
