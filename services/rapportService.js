// services/rapportService.js
const path = require("path");
const fs = require("fs");
const sendEmail = require("../utils/sendEmail");
const notificationService = require("../services/notificationService");

// Soumission d’un rapport (soumission illimitée après commentaire)
exports.submitReport = async (user, file, db) => {
  if (!file) throw new Error("Aucun fichier fourni.");

  const [[etudiant]] = await db.execute("SELECT id, prenom, nom FROM Etudiant WHERE email=?", [user.email]);
  if (!etudiant) throw new Error("Étudiant non trouvé.");

  const [[stage]] = await db.execute("SELECT id FROM Stage WHERE etudiantId=?", [etudiant.id]);
  if (!stage) throw new Error("Aucun stage actif trouvé.");

  const dateSoumission = new Date().toISOString().slice(0, 10);
  const filePath = `/uploads/${file.filename}`;

  await db.execute(
    `INSERT INTO RapportStage (stageId, etudiantId, dateSoumission, fichier, statutAcademique, statutProfessionnel)
     VALUES (?, ?, ?, ?, FALSE, FALSE)`,
    [stage.id, etudiant.id, dateSoumission, filePath]
  );

  const [[encadrants]] = await db.execute(`
    SELECT aca.email AS acaEmail, aca.id AS acaId,
           pro.email AS proEmail, pro.id AS proId
    FROM Stage s
    JOIN EncadrantAcademique aca ON aca.id = s.encadrantAcademiqueId
    JOIN EncadrantProfessionnel pro ON pro.id = s.encadrantProfessionnelId
    WHERE s.id = ?
  `, [stage.id]);

  const message = `L’étudiant ${etudiant.prenom} ${etudiant.nom} a soumis son rapport de stage.`;

  await sendEmail({
    to: [encadrants.acaEmail, encadrants.proEmail],
    subject: "Nouveau rapport soumis",
    html: `<p>${message}</p><p><a href='http://localhost:3000${filePath}'>Voir le fichier</a></p>`
  });

  await db.execute(`
    INSERT INTO notifications (destinataire_id, destinataire_type, message)
    VALUES (?, 'encadrant_academique', ?), (?, 'encadrant_professionnel', ?)
  `, [encadrants.acaId, message, encadrants.proId, message]);

  return { message: "Rapport soumis avec succès." };
};

// Validation du rapport
exports.validateReport = async (body, user, db) => {
  const { rapportId } = body;
  const { role, email } = user;

  let column = null;
  if (role === "EncadrantAcademique") column = "statutAcademique";
  else if (role === "EncadrantProfessionnel") column = "statutProfessionnel";
  else if (role === "TierDebloqueur") column = "tierDebloqueurValid";

  if (!column) throw new Error("Rôle non autorisé pour validation.");

  await db.execute(`UPDATE RapportStage SET ${column}=TRUE WHERE id=?`, [rapportId]);

  const [[rapport]] = await db.execute(`SELECT etudiantId, stageId FROM RapportStage WHERE id=?`, [rapportId]);
  const [[etudiant]] = await db.execute(`SELECT prenom, nom, email FROM Etudiant WHERE id=?`, [rapport.etudiantId]);

  await notificationService.notifyUser({
    toRole: "Etudiant",
    toId: rapport.etudiantId,
    subject: "Validation partielle du rapport",
    templateName: "rapport_validated",
    templateData: {
      etudiantPrenom: etudiant.prenom,
      encadrantPrenom: "",
      encadrantNom: "",
      institution: role === "EncadrantAcademique" ? "Université" : "Entreprise",
      encadrantType: role.toLowerCase()
    }
  });

  // Si validation complète => notifier ResponsableEntreprise
  const [[rapportStatut]] = await db.execute(`
    SELECT statutAcademique, statutProfessionnel, tierDebloqueurValid
    FROM RapportStage WHERE id=?`, [rapportId]);

  if ((rapportStatut.statutAcademique && rapportStatut.statutProfessionnel) || rapportStatut.tierDebloqueurValid) {
    const [[responsable]] = await db.execute(
      `SELECT id FROM ResponsableEntreprise WHERE entrepriseId = (
        SELECT entrepriseId FROM Stage WHERE id = ?
      )`,
      [rapport.stageId]
    );

    if (responsable) {
      await notificationService.notifyUser({
        toRole: "ResponsableEntreprise",
        toId: responsable.id,
        subject: "Rapport prêt pour attestation",
        templateName: "rapport_validated",
        templateData: {
          etudiantPrenom: etudiant.prenom,
          encadrantPrenom: "",
          encadrantNom: "",
          institution: "Entreprise",
          encadrantType: "automatique"
        }
      });
    }
  }

  return { message: "Validation enregistrée." };
};

// Ajout de commentaire
exports.commenterRapport = async (body, user, db) => {
  const { rapportId, commentaire } = body;
  const [[rapport]] = await db.execute(`
    SELECT etudiantId FROM RapportStage WHERE id=?`, [rapportId]);

  const [[etudiant]] = await db.execute(`SELECT email FROM Etudiant WHERE id=?`, [rapport.etudiantId]);

  await db.execute(`
    INSERT INTO CommentaireRapport (rapportId, commentaire, date_envoi)
    VALUES (?, ?, NOW())
  `, [rapportId, commentaire]);

  await sendEmail({
    to: etudiant.email,
    subject: "Commentaire sur votre rapport",
    html: `<p>Un encadrant a commenté votre rapport : <blockquote>${commentaire}</blockquote></p>`
  });

  await db.execute(`INSERT INTO notifications (destinataire_id, destinataire_type, message)
    VALUES (?, 'etudiant', ?)
  `, [rapport.etudiantId, `Nouveau commentaire sur votre rapport : ${commentaire}`]);

  return { message: "Commentaire enregistré." };
};

// Récupération des rapports à valider
exports.getRapportsEncadrant = async (user, db) => {
  const { email, role } = user;
  let table = role === "EncadrantAcademique" ? "EncadrantAcademique" : "EncadrantProfessionnel";
  let champ = role === "EncadrantAcademique" ? "s.encadrantAcademiqueId" : "s.encadrantProfessionnelId";

  const [[encadrant]] = await db.execute(`SELECT id FROM ${table} WHERE email=?`, [email]);

  const [rapports] = await db.execute(`
    SELECT r.id, r.fichier, r.dateSoumission, e.nom AS nomEtudiant, e.prenom AS prenomEtudiant
    FROM RapportStage r
    JOIN Etudiant e ON r.etudiantId = e.id
    JOIN Stage s ON r.stageId = s.id
    WHERE ${champ} = ?
  `, [encadrant.id]);

  return rapports;
};

// Commentaires
exports.getCommentairesRapport = async (rapportId, db) => {
  const [rows] = await db.execute(`
    SELECT commentaire, date_envoi FROM CommentaireRapport WHERE rapportId = ? ORDER BY date_envoi DESC
  `, [rapportId]);
  return rows;
};

// Vérification des soumissions en retard (7 jours avant fin stage)
exports.verifierSoumissionsTardives = async (db) => {
  const [rows] = await db.execute(`
    SELECT s.id AS stageId, s.etudiantId, e.email, s.dateFin
    FROM Stage s
    JOIN Etudiant e ON e.id = s.etudiantId
    WHERE s.id NOT IN (SELECT DISTINCT stageId FROM RapportStage)
      AND CURRENT_DATE > DATE_SUB(s.dateFin, INTERVAL 7 DAY)
  `);

  for (const row of rows) {
    await notificationService.notifyUser({
      toRole: "Etudiant",
      toId: row.etudiantId,
      subject: "Rappel de soumission rapport",
      templateName: "soumission_rappel",
      templateData: {
        etudiantPrenom: "",
        encadrantPrenom: "",
        encadrantNom: "",
        institution: "Université",
        encadrantType: "automatique"
      }
    });
  }
  return rows;
};

// Réaffectation à un tier débloqueur si pas validé 7 jours après fin
exports.verifierEtRedirigerVersTier = async (db) => {
  const [rapports] = await db.execute(`
    SELECT r.id AS rapportId, s.id AS stageId, s.dateFin,
           r.statutAcademique, r.statutProfessionnel, r.tierDebloqueurValid,
           e.universiteId, ent.id AS entrepriseId
    FROM RapportStage r
    JOIN Stage s ON s.id = r.stageId
    JOIN Etudiant e ON r.etudiantId = e.id
    JOIN EncadrantProfessionnel pro ON s.encadrantProfessionnelId = pro.id
    JOIN Entreprise ent ON pro.entrepriseId = ent.id
    WHERE CURRENT_DATE > DATE_ADD(s.dateFin, INTERVAL 7 DAY)
      AND r.statutAcademique = FALSE AND r.statutProfessionnel = FALSE
      AND r.tierDebloqueurValid = FALSE
  `);

  for (const r of rapports) {
    const [tiers] = await db.execute(
      `SELECT id FROM TierDebloqueur WHERE universiteId=? OR entrepriseId=? LIMIT 1`,
      [r.universiteId, r.entrepriseId]
    );

    if (tiers.length > 0) {
      await db.execute(`UPDATE RapportStage SET tierDebloqueurId=? WHERE id=?`, [tiers[0].id, r.rapportId]);
    }
  }

  return rapports;
};
