const db = require("../config/db");
const { genererIdentifiantStage } = require("../utils/identifiantUtils");
const notificationService = require("./notificationService");

exports.proposerSujet = async ({
  sujet,
  objectifs,
  dateDebut,
  dateFin,
  encadrantAcademique,
  encadrantProfessionnel,
  etudiantEmail,
}) => {
  const [[etudiant]] = await db.execute("SELECT id, prenom, nom, universiteId FROM Etudiant WHERE email = ?", [etudiantEmail]);
  const [[aca]] = await db.execute("SELECT id, prenom, nom, email FROM EncadrantAcademique WHERE email = ?", [encadrantAcademique]);
  const [[pro]] = await db.execute("SELECT id, prenom, nom, email, entrepriseId FROM EncadrantProfessionnel WHERE email = ?", [encadrantProfessionnel]);
  const [[entreprise]] = await db.execute("SELECT nom FROM Entreprise WHERE id = ?", [pro.entrepriseId]);
  const [[universite]] = await db.execute("SELECT nom FROM Universite WHERE id = ?", [etudiant.universiteId]);

  const [result] = await db.execute(`
    INSERT INTO SujetStage (titre, description, dateDebut, dateFin, encadrantAcademiqueId, encadrantProfessionnelId, etudiantId, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'en attente')
  `, [sujet, objectifs, dateDebut, dateFin, aca.id, pro.id, etudiant.id]);

  const baseData = {
    etudiantPrenom: etudiant.prenom,
    etudiantNom: etudiant.nom,
    sujet,
    description: objectifs,
    dateDebut,
    dateFin,
    entreprise: entreprise.nom,
    universite: universite.nom
  };

  await notificationService.notifyUser({
    toId: aca.id,
    toRole: "EncadrantAcademique",
    subject: "Nouvelle proposition de stage",
    templateName: "stage_proposed",
    templateData: {
      ...baseData,
      encadrantPrenom: aca.prenom,
      encadrantNom: aca.nom
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
      encadrantPrenom: pro.prenom,
      encadrantNom: pro.nom
    },
    message: "Un étudiant a proposé un sujet de stage à valider."
  });
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
};

exports.creerStageDepuisSujet = async (sujet) => {
  const [[etudiant]] = await db.execute("SELECT universiteId, prenom, nom FROM Etudiant WHERE id=?", [sujet.etudiantId]);
  const [[pro]] = await db.execute("SELECT entrepriseId FROM EncadrantProfessionnel WHERE id=?", [sujet.encadrantProfessionnelId]);

  const identifiant = await genererIdentifiantStage(pro.entrepriseId, etudiant.universiteId);

  const [result] = await db.execute(`
    INSERT INTO Stage (etudiantId, encadrantAcademiqueId, encadrantProfessionnelId, entrepriseId, titre, dateDebut, dateFin, intervalleValidation, identifiant_unique)
    VALUES (?, ?, ?, ?, ?, ?, ?, 10, ?)
  `, [
    sujet.etudiantId,
    sujet.encadrantAcademiqueId,
    sujet.encadrantProfessionnelId,
    pro.entrepriseId,
    sujet.titre,
    sujet.dateDebut,
    sujet.dateFin,
    identifiant
  ]);

  await db.execute("UPDATE SujetStage SET status='validé', stageId=? WHERE id=?", [result.insertId, sujet.id]);

  await notificationService.notifyUser({
    toId: sujet.etudiantId,
    toRole: "Etudiant",
    subject: `Votre proposition a été accepté  et votre stage est officiellement crée en plateforme s : ${identifiant}`,
    templateName: "stage_validated",
    templateData: {
      etudiantPrenom: etudiant.prenom,
      etudiantNom: etudiant.nom,
      identifiantStage: identifiant,
      titreStage: sujet.titre,
      dateDebut: sujet.dateDebut,
      dateFin: sujet.dateFin
    },
    message: `Votre stage a été crée avec l'identifiant ${identifiant}.`
  });
};

exports.getPropositionsEncadrant = async (type, email) => {
  const table = type === "academique" ? "EncadrantAcademique" : "EncadrantProfessionnel";
  const col = type === "academique" ? "encadrantAcademiqueId" : "encadrantProfessionnelId";

  const [[encadrant]] = await db.execute(`SELECT id FROM ${table} WHERE email = ?`, [email]);

  const [rows] = await db.execute(`
    SELECT s.id, s.titre, s.description, s.dateDebut, s.dateFin,
           e.prenom AS etudiantPrenom, e.nom AS etudiantNom
    FROM SujetStage s
    JOIN Etudiant e ON s.etudiantId = e.id
    WHERE s.${col} = ? AND s.status = 'en attente'
  `, [encadrant.id]);

  return rows.map(r => ({
    ...r,
    etudiantNomComplet: `${r.etudiantPrenom} ${r.etudiantNom}`
  }));
};

exports.getEncadrements = async (type, email) => {
  const table = type === "academique" ? "EncadrantAcademique" : "EncadrantProfessionnel";
  const col = type === "academique" ? "encadrantAcademiqueId" : "encadrantProfessionnelId";
  const [[user]] = await db.execute(`SELECT id FROM ${table} WHERE email = ?`, [email]);

  const [rows] = await db.execute(`
    SELECT S.*, E.nom AS entrepriseNom
    FROM Stage S
    JOIN Entreprise E ON S.entrepriseId = E.id
    WHERE S.${col} = ?
  `, [user.id]);

  return rows;
};

exports.getCurrentStageByEmail = async (email) => {
  const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email = ?", [email]);
  if (!etudiant) return null;

  const [rows] = await db.execute(`
    SELECT 
      S.*, 
      E.nom AS entreprise,
      A.prenom AS acaPrenom,
      A.nom AS acaNom,
      P.prenom AS proPrenom,
      P.nom AS proNom
    FROM Stage S
    JOIN Entreprise E ON S.entrepriseId = E.id
    JOIN EncadrantAcademique A ON S.encadrantAcademiqueId = A.id
    JOIN EncadrantProfessionnel P ON S.encadrantProfessionnelId = P.id
    WHERE S.etudiantId = ?
  `, [etudiant.id]);

  return rows[0] || null;
};
