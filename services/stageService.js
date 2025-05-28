const db = require("../config/db");
const { genererIdentifiantStage } = require("../utils/identifiantUtils");
const notificationService = require("./notificationService");
const { buildUrl } = require("../utils/urlUtils"); 
// =======================
// 1. Proposition de sujet
// =======================
exports.proposerSujet = async ({
  sujet,
  objectifs,
  dateDebut,
  dateFin,
  encadrantAcademique,
  encadrantProfessionnel,
  etudiantEmail,
}) => {
  const [[etudiant]] = await db.execute(
    "SELECT id, prenom, nom, universiteId FROM Etudiant WHERE email = ?",
    [etudiantEmail]
  );
  const [[aca]] = await db.execute(
    "SELECT id, prenom, nom, email FROM EncadrantAcademique WHERE email = ?",
    [encadrantAcademique]
  );
  const [[pro]] = await db.execute(
    "SELECT id, prenom, nom, email, entrepriseId FROM EncadrantProfessionnel WHERE email = ?",
    [encadrantProfessionnel]
  );
  const [[entreprise]] = await db.execute(
    "SELECT nom FROM Entreprise WHERE id = ?",
    [pro.entrepriseId]
  );
  const [[universite]] = await db.execute(
    "SELECT nom FROM Universite WHERE id = ?",
    [etudiant.universiteId]
  );

  if (!etudiant || !aca || !pro || !entreprise || !universite) {
    throw new Error("Données manquantes pour la création de la proposition.");
  }

  const [result] = await db.execute(
    `INSERT INTO SujetStage (titre, description, dateDebut, dateFin, encadrantAcademiqueId, encadrantProfessionnelId, etudiantId, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'en attente')`,
    [sujet, objectifs, dateDebut, dateFin, aca.id, pro.id, etudiant.id]
  );

  const sujetUrl = buildUrl(`/encadrant/proposition/${result.insertId}`); // 

  
const baseUrl = process.env.PUBLIC_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

const baseData = {
  etudiantPrenom: etudiant.prenom,
  etudiantNom: etudiant.nom,
  titreStage: sujet,
  dateProposition: new Date().toLocaleDateString("fr-FR"),
  baseUrl,
  year: new Date().getFullYear(),
};



  await notificationService.notifyUser({
    toId: aca.id,
    toRole: "EncadrantAcademique",
    subject: "Nouvelle proposition de stage",
    templateName: "stage_proposed",
    templateData: {
      ...baseData,
      destinatairePrenom: aca.prenom
    },
    message: "Un étudiant a proposé un sujet de stage à valider."
  });

  await notificationService.notifyUser({
    toId: pro.id,
    toRole: "EncadrantProfessionnel",
    subject: "Nouvelle proposition de stage",
    templateName: "stage_proposed",
    templateData: {
      ...baseData,
      destinatairePrenom: pro.prenom
    },
    message: "Un étudiant a proposé un sujet de stage à valider."
  });
};

// ========================
// 2. Validation / Refus
// ========================
exports.validerOuRejeterSujet = async ({ sujetId, action, commentaire, email, role }) => {
  const column = role === "EncadrantAcademique" ? "aca_validé" : "pro_validé";
  const refusCol = role === "EncadrantAcademique" ? "aca_refusé" : "pro_refusé";

  if (action === "accepter") {
    await db.execute(`UPDATE SujetStage SET ${column} = TRUE WHERE id = ?`, [sujetId]);
  } else {
    await db.execute(
      `UPDATE SujetStage SET ${refusCol} = TRUE, status = 'refusé' WHERE id = ?`,
      [sujetId]
    );
    return;
  }

  const [[sujet]] = await db.execute("SELECT * FROM SujetStage WHERE id = ?", [sujetId]);

 if (sujet.aca_validé && sujet.pro_validé) {
  await exports.creerStageDepuisSujet(sujet);
} else {
  const [[etudiant]] = await db.execute(
    "SELECT prenom, nom, email FROM Etudiant WHERE id = ?",
    [sujet.etudiantId]
  );

  const encadrantCol =
    role === "EncadrantAcademique"
      ? "encadrantAcademiqueId"
      : "encadrantProfessionnelId";

  const [[encadrant]] = await db.execute(
    `SELECT prenom, nom FROM ${role} WHERE id = ?`,
    [sujet[encadrantCol]]
  );

  await notificationService.notifyUser({
    toId: sujet.etudiantId,
    toRole: "Etudiant",
    subject: `Validation partielle de votre sujet de stage`,
    templateName: "stage_partial_validation",
    templateData: {
      etudiantPrenom: etudiant.prenom,
      encadrantPrenom: encadrant.prenom,
      encadrantNom: encadrant.nom,
      titreStage: sujet.titre,
      dashboardUrl: buildUrl("/etudiant")
    },
    message: `Votre sujet de stage a été validé par un encadrant. En attente de la validation de l'autre.`
  });
}

};

// ========================
// 3. Création de stage
// ========================
exports.creerStageDepuisSujet = async (sujet) => {
  const [[etudiant]] = await db.execute(
    "SELECT universiteId, prenom, nom FROM Etudiant WHERE id=?",
    [sujet.etudiantId]
  );
  const [[pro]] = await db.execute(
    "SELECT entrepriseId FROM EncadrantProfessionnel WHERE id=?",
    [sujet.encadrantProfessionnelId]
  );

  const identifiant = await genererIdentifiantStage(pro.entrepriseId, etudiant.universiteId);

  const [result] = await db.execute(
    `INSERT INTO Stage (etudiantId, encadrantAcademiqueId, encadrantProfessionnelId, entrepriseId, titre, dateDebut, dateFin, intervalleValidation, identifiant_unique)
     VALUES (?, ?, ?, ?, ?, ?, ?, 10, ?)`,
    [
      sujet.etudiantId,
      sujet.encadrantAcademiqueId,
      sujet.encadrantProfessionnelId,
      pro.entrepriseId,
      sujet.titre,
      sujet.dateDebut,
      sujet.dateFin,
      identifiant
    ]
  );

  await db.execute(
    "UPDATE SujetStage SET status='validé', stageId=? WHERE id=?",
    [result.insertId, sujet.id]
  );

  await notificationService.notifyUser({
    toId: sujet.etudiantId,
    toRole: "Etudiant",
    subject: `Votre proposition a été acceptée et votre stage est officiellement créé : ${identifiant}`,
    templateName: "stage_validated",
    templateData: {
      etudiantPrenom: etudiant.prenom,
      etudiantNom: etudiant.nom,
      identifiantStage: identifiant,
      titreStage: sujet.titre,
      dateDebut: sujet.dateDebut,
      dateFin: sujet.dateFin,
      dashboardUrl: buildUrl("/etudiant")

    },
    message: `Votre stage a été créé avec l'identifiant ${identifiant}.`
  });
};

// ===============================
// 4. Propositions à valider (GET)
// ===============================
exports.getPropositionsEncadrant = async (type, email) => {
  const table = type === "academique" ? "EncadrantAcademique" : "EncadrantProfessionnel";
  const col = type === "academique" ? "encadrantAcademiqueId" : "encadrantProfessionnelId";

  const [[encadrant]] = await db.execute(`SELECT id FROM ${table} WHERE email = ?`, [email]);

  const [rows] = await db.execute(
    `SELECT s.id, s.titre, s.description, s.dateDebut, s.dateFin,
            e.prenom AS etudiantPrenom, e.nom AS etudiantNom
     FROM SujetStage s
     JOIN Etudiant e ON s.etudiantId = e.id
     WHERE s.${col} = ? AND s.status = 'en attente'`,
    [encadrant.id]
  );

  return rows.map((r) => ({
    ...r,
    etudiantNomComplet: `${r.etudiantPrenom} ${r.etudiantNom}`
  }));
};

// ===============================
// 5. Liste des stages encadrés
// ===============================
exports.getEncadrements = async (type, email) => {
  const table = type === "academique" ? "EncadrantAcademique" : "EncadrantProfessionnel";
  const col = type === "academique" ? "encadrantAcademiqueId" : "encadrantProfessionnelId";

  const [[user]] = await db.execute(`SELECT id FROM ${table} WHERE email = ?`, [email]);

  const [rows] = await db.execute(
    `SELECT S.*, E.nom AS entrepriseNom
     FROM Stage S
     JOIN Entreprise E ON S.entrepriseId = E.id
     WHERE S.${col} = ?`,
    [user.id]
  );

  return rows;
};

// ===============================
// 6. Récupération du stage en cours
// ===============================
exports.getCurrentStageByEmail = async (email) => {
  const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email = ?", [email]);
  if (!etudiant) return null;

  const [rows] = await db.execute(
    `SELECT S.*, 
            E.nom AS entreprise,
            A.prenom AS acaPrenom, A.nom AS acaNom, A.email AS acaEmail,
            P.prenom AS proPrenom, P.nom AS proNom, P.email AS proEmail
     FROM Stage S
     JOIN Entreprise E ON S.entrepriseId = E.id
     JOIN EncadrantAcademique A ON S.encadrantAcademiqueId = A.id
     JOIN EncadrantProfessionnel P ON S.encadrantProfessionnelId = P.id
     WHERE S.etudiantId = ? AND S.etat = 'en attente' AND S.estHistorique = FALSE`,
    [etudiant.id]
  );

  return rows[0] || null;
};

//
exports.getStagesHistoriquesByEmail = async (email) => {
  const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email = ?", [email]);
  if (!etudiant) return [];

  const [rows] = await db.execute(
    `SELECT S.*, 
            E.nom AS entreprise,
            A.prenom AS acaPrenom, A.nom AS acaNom,
            P.prenom AS proPrenom, P.nom AS proNom
     FROM Stage S
     JOIN Entreprise E ON S.entrepriseId = E.id
     JOIN EncadrantAcademique A ON S.encadrantAcademiqueId = A.id
     JOIN EncadrantProfessionnel P ON S.encadrantProfessionnelId = P.id
     WHERE S.etudiantId = ? AND S.estHistorique = TRUE
     ORDER BY S.dateDebut DESC`,
    [etudiant.id]
  );

  return rows;
};

