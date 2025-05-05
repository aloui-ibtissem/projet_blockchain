const path = require("path");
const sendEmail = require("../utils/sendEmail");
const notificationService = require("./notificationService");
const db = require("../config/db");

/**
 * Soumission du rapport par l’étudiant (vérifie qu’il ne reste pas plus de 7 jours).
 */
exports.submitReport = async (user, file) => {
  if (!file) throw new Error("Aucun fichier fourni.");

  const [[etudiant]] = await db.execute("SELECT id, prenom, nom FROM Etudiant WHERE email=?", [user.email]);
  if (!etudiant) throw new Error("Étudiant introuvable.");

  const [[stage]] = await db.execute(`
    SELECT id, dateFin FROM Stage WHERE etudiantId=?
  `, [etudiant.id]);
  if (!stage) throw new Error("Aucun stage trouvé.");

  const today = new Date();
  const dateFin = new Date(stage.dateFin);
  const diffJours = (dateFin - today) / (1000 * 60 * 60 * 24);

  if (diffJours > 7) {
    throw new Error("Vous ne pouvez soumettre le rapport que dans les 7 jours précédant la fin du stage.");
  }

  const filePath = `/uploads/${file.filename}`;
  const dateSoumission = today.toISOString().slice(0, 10);

  await db.execute(`
    INSERT INTO RapportStage (stageId, etudiantId, dateSoumission, fichier)
    VALUES (?, ?, ?, ?)
  `, [stage.id, etudiant.id, dateSoumission, filePath]);

  // Récupération encadrants
  const [[encadrants]] = await db.execute(`
    SELECT aca.id AS acaId, aca.email AS acaEmail,
           pro.id AS proId, pro.email AS proEmail
    FROM Stage s
    JOIN EncadrantAcademique aca ON s.encadrantAcademiqueId = aca.id
    JOIN EncadrantProfessionnel pro ON s.encadrantProfessionnelId = pro.id
    WHERE s.id = ?
  `, [stage.id]);

  const message = `L’étudiant ${etudiant.prenom} ${etudiant.nom} a soumis son rapport.`;

  await sendEmail({
    to: [encadrants.acaEmail, encadrants.proEmail],
    subject: "Nouveau rapport soumis",
    templateName: "rapport_submitted",
    templateData: {
      etudiantNom: `${etudiant.prenom} ${etudiant.nom}`,
      lienRapport: `http://localhost:3000${filePath}`
    }
  });

  await notificationService.createMany([
    { toId: encadrants.acaId, toType: "encadrant_academique", message },
    { toId: encadrants.proId, toType: "encadrant_professionnel", message }
  ]);

  return { message: "Rapport soumis et notifications envoyées." };
};

/**
 * Validation par encadrant ou tier.
 */
exports.validateReport = async ({ rapportId }, user) => {
  const { role, email } = user;
  let column;

  if (role === "EncadrantAcademique") column = "statutAcademique";
  else if (role === "EncadrantProfessionnel") column = "statutProfessionnel";
  else if (role === "TierDebloqueur") column = "tierDebloqueurValid";
  else throw new Error("Rôle non autorisé.");

  await db.execute(`UPDATE RapportStage SET ${column}=TRUE WHERE id=?`, [rapportId]);

  const [[rapport]] = await db.execute(`SELECT etudiantId, stageId FROM RapportStage WHERE id=?`, [rapportId]);
  const [[etudiant]] = await db.execute(`SELECT prenom, nom, email FROM Etudiant WHERE id=?`, [rapport.etudiantId]);

  // Vérification validation complète
  const [[status]] = await db.execute(`
    SELECT statutAcademique, statutProfessionnel, tierDebloqueurValid
    FROM RapportStage WHERE id=?`, [rapportId]);

  const isValid = (status.statutAcademique && status.statutProfessionnel) || status.tierDebloqueurValid;

  if (isValid) {
    const [[resp]] = await db.execute(`
      SELECT r.id FROM ResponsableEntreprise r
      JOIN Stage s ON s.entrepriseId = r.entrepriseId
      WHERE s.id = ?`, [rapport.stageId]);

    if (resp) {
      await notificationService.notifyUser({
        toRole: "ResponsableEntreprise",
        toId: resp.id,
        subject: "Rapport prêt pour attestation",
        templateName: "rapport_validated",
        templateData: {
          etudiantPrenom: etudiant.prenom
        }
      });
    }
  }

  return { message: "Validation enregistrée." };
};

/**
 * Ajout de commentaire sur le rapport.
 */
exports.commenterRapport = async ({ rapportId, commentaire }) => {
  const [[rapport]] = await db.execute("SELECT etudiantId FROM RapportStage WHERE id=?", [rapportId]);
  const [[etudiant]] = await db.execute("SELECT email FROM Etudiant WHERE id=?", [rapport.etudiantId]);

  await db.execute(`
    INSERT INTO CommentaireRapport (rapportId, commentaire)
    VALUES (?, ?)`, [rapportId, commentaire]);

  await sendEmail({
    to: etudiant.email,
    subject: "Commentaire sur votre rapport",
    templateName: "commentaire",
    templateData: { commentaire }
  });

  await notificationService.notifyUser({
    toRole: "Etudiant",
    toId: rapport.etudiantId,
    subject: "Commentaire reçu",
    templateName: "commentaire",
    templateData: { commentaire }
  });

  return { message: "Commentaire enregistré et notifié." };
};
