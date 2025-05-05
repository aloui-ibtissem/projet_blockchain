const db = require("../config/db");
const { genererIdentifiantStage } = require("../utils/identifiantUtils");
const sendEmail = require("../utils/sendEmail");
const notificationService = require("./notificationService");

exports.proposerSujet = async ({ sujet, objectifs, dateDebut, dateFin, encadrantAcademique, encadrantProfessionnel, etudiantEmail }) => {
  const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email=?", [etudiantEmail]);
  const [[aca]] = await db.execute("SELECT id FROM EncadrantAcademique WHERE email=?", [encadrantAcademique]);
  const [[pro]] = await db.execute("SELECT id FROM EncadrantProfessionnel WHERE email=?", [encadrantProfessionnel]);

  if (!etudiant || !aca || !pro) throw new Error("Identifiants invalides.");

  const [result] = await db.execute(`
    INSERT INTO SujetStage (titre, description, dateDebut, dateFin, encadrantAcademiqueId, encadrantProfessionnelId, etudiantId, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'en attente')
  `, [sujet, objectifs, dateDebut, dateFin, aca.id, pro.id, etudiant.id]);

  const sujetId = result.insertId;

  // Notifications et mails
  await notificationService.notifyUser(aca.id, "encadrant_academique", `Nouvelle proposition de stage à valider.`, encadrantAcademique);
  await notificationService.notifyUser(pro.id, "encadrant_professionnel", `Nouvelle proposition de stage à valider.`, encadrantProfessionnel);
};

exports.validerOuRejeterSujet = async ({ sujetId, action, commentaire, email, role }) => {
  const column = role === "EncadrantAcademique" ? "aca_validé" : "pro_validé";
  const refusCol = role === "EncadrantAcademique" ? "aca_refusé" : "pro_refusé";

  if (action === "accepter") {
    await db.execute(`UPDATE SujetStage SET ${column} = TRUE WHERE id = ?`, [sujetId]);
  } else {
    await db.execute(`UPDATE SujetStage SET ${refusCol} = TRUE, status = 'refusé' WHERE id = ?`, [sujetId]);
    return;
  }

  const [[sujet]] = await db.execute("SELECT * FROM SujetStage WHERE id=?", [sujetId]);

  if (sujet.aca_validé && sujet.pro_validé) {
    await exports.creerStageDepuisSujet(sujet);
  }

  await db.execute(`INSERT INTO CommentaireSujet (sujetId, commentaire, auteurEmail, date) VALUES (?, ?, ?, NOW())`, [sujetId, commentaire || "", email]);
};

exports.creerStageDepuisSujet = async (sujet) => {
  const [[etudiant]] = await db.execute("SELECT universiteId FROM Etudiant WHERE id=?", [sujet.etudiantId]);
  const [[pro]] = await db.execute("SELECT entrepriseId FROM EncadrantProfessionnel WHERE id=?", [sujet.encadrantProfessionnelId]);

  const identifiant = await genererIdentifiantStage(pro.entrepriseId, etudiant.universiteId);

  const [result] = await db.execute(`
    INSERT INTO Stage (etudiantId, encadrantAcademiqueId, encadrantProfessionnelId, entrepriseId, titre, dateDebut, dateFin, intervalleValidation, identifiant_unique)
    VALUES (?, ?, ?, ?, ?, ?, ?, 10, ?)
  `, [sujet.etudiantId, sujet.encadrantAcademiqueId, sujet.encadrantProfessionnelId, pro.entrepriseId, sujet.titre, sujet.dateDebut, sujet.dateFin, identifiant]);

  const stageId = result.insertId;
  await db.execute("UPDATE SujetStage SET status='validé', stageId=? WHERE id=?", [stageId, sujet.id]);

  // Notification à l'étudiant
  const [[etudiantMail]] = await db.execute("SELECT email FROM Etudiant WHERE id=?", [sujet.etudiantId]);
  await notificationService.notifyUser(sujet.etudiantId, "etudiant", `Votre stage a été validé et créé. ID : ${identifiant}`, etudiantMail.email);
};

exports.getPropositionsEncadrant = async (type, email) => {
  const table = type === "academique" ? "EncadrantAcademique" : "EncadrantProfessionnel";
  const [rows] = await db.execute(`SELECT id FROM ${table} WHERE email = ?`, [email]);
  const encadrantId = rows[0].id;

  const col = type === "academique" ? "encadrantAcademiqueId" : "encadrantProfessionnelId";

  const [propositions] = await db.execute(`
    SELECT * FROM SujetStage WHERE ${col} = ? AND status = 'en attente'
  `, [encadrantId]);

  return propositions;
};

exports.getEncadrements = async (type, email) => {
  const table = type === "academique" ? "EncadrantAcademique" : "EncadrantProfessionnel";
  const [rows] = await db.execute(`SELECT id FROM ${table} WHERE email = ?`, [email]);
  const encadrantId = rows[0].id;

  const col = type === "academique" ? "encadrantAcademiqueId" : "encadrantProfessionnelId";

  const [stages] = await db.execute(`
    SELECT S.*, E.nom AS entrepriseNom FROM Stage S
    JOIN Entreprise E ON S.entrepriseId = E.id
    WHERE S.${col} = ?
  `, [encadrantId]);

  return stages;
};

exports.getCurrentStageByEmail = async (email) => {
  const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email = ?", [email]);
  const [rows] = await db.execute("SELECT * FROM Stage WHERE etudiantId = ?", [etudiant.id]);
  return rows[0] || null;
};
