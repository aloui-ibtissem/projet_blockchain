const db = require("../config/db");
const path = require("path");
const fs = require("fs");
const { notifyUser } = require("./notificationService");

exports.soumettreRapport = async (email, fichier) => {
  const [[etudiant]] = await db.execute("SELECT id, prenom, nom, universiteId FROM Etudiant WHERE email = ?", [email]);
  if (!etudiant) throw new Error("Étudiant introuvable pour l'email " + email);

  const [[stage]] = await db.execute("SELECT * FROM Stage WHERE etudiantId = ?", [etudiant.id]);
  if (!stage) throw new Error("Aucun stage trouvé");

  const rapportName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${fichier.originalname}`;
  const rapportPath = `/uploads/${rapportName}`;
  const fullPath = path.join(__dirname, `../public${rapportPath}`);
  fs.writeFileSync(fullPath, fichier.buffer);

  const [existing] = await db.execute("SELECT * FROM RapportStage WHERE stageId = ?", [stage.id]);
  if (existing.length > 0) {
    await db.execute("UPDATE RapportStage SET fichier = ?, dateSoumission = NOW() WHERE stageId = ?", [rapportPath, stage.id]);
  } else {
    await db.execute(
      `INSERT INTO RapportStage (stageId, etudiantId, fichier, dateSoumission)
       VALUES (?, ?, ?, NOW())`,
      [stage.id, etudiant.id, rapportPath]
    );
  }

  const [[aca]] = await db.execute("SELECT id, prenom FROM EncadrantAcademique WHERE id = ?", [stage.encadrantAcademiqueId]);
  const [[pro]] = await db.execute("SELECT id, prenom FROM EncadrantProfessionnel WHERE id = ?", [stage.encadrantProfessionnelId]);
  const [[universite]] = await db.execute("SELECT nom FROM Universite WHERE id = ?", [etudiant.universiteId]);

  const templateData = {
    prenom: etudiant.prenom,
    nom: etudiant.nom,
    universite: universite.nom,
    titre: stage.titre,
    dateSoumission: new Date().toLocaleDateString(),
    lien: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard`
  };

  for (const enc of [
    { id: aca.id, role: 'EncadrantAcademique', prenom: aca.prenom },
    { id: pro.id, role: 'EncadrantProfessionnel', prenom: pro.prenom }
  ]) {
    await notifyUser({
      toId: enc.id,
      toRole: enc.role,
      subject: "Rapport de stage soumis",
      templateName: "rapport_submitted",
      templateData,
      message: `Un rapport de stage a été soumis par ${etudiant.prenom} ${etudiant.nom}.`
    });
  }
};

exports.validerRapport = async (email, role, rapportId) => {
  const roleMap = {
    EncadrantAcademique: "academique",
    EncadrantProfessionnel: "professionnel"
  };
  const typeEncadrant = roleMap[role];
  if (!typeEncadrant) throw new Error("Rôle non autorisé.");

  const table = role === "EncadrantAcademique" ? "EncadrantAcademique" : "EncadrantProfessionnel";
  const [[encadrant]] = await db.execute(`SELECT id FROM ${table} WHERE email = ?`, [email]);
  if (!encadrant) throw new Error("Encadrant introuvable");

  const [rows] = await db.execute("SELECT * FROM EvaluationRapport WHERE rapportId = ? AND typeEncadrant = ?", [rapportId, typeEncadrant]);

  if (rows.length > 0) {
    await db.execute("UPDATE EvaluationRapport SET validation = TRUE WHERE rapportId = ? AND typeEncadrant = ?", [rapportId, typeEncadrant]);
  } else {
    await db.execute(
      `INSERT INTO EvaluationRapport (rapportId, encadrantId, typeEncadrant, validation)
       VALUES (?, ?, ?, TRUE)`,
      [rapportId, encadrant.id, typeEncadrant]
    );
  }

  const [[rapport]] = await db.execute("SELECT * FROM RapportStage WHERE id = ?", [rapportId]);
  const [[stage]] = await db.execute("SELECT * FROM Stage WHERE id = ?", [rapport.stageId]);
  const [[etudiant]] = await db.execute("SELECT * FROM Etudiant WHERE id = ?", [stage.etudiantId]);

  const [validations] = await db.execute("SELECT * FROM EvaluationRapport WHERE rapportId = ?", [rapportId]);
  const validatedCount = validations.filter(v => v.validation).length;

  if (validatedCount >= 2) {
    await notifyUser({
      toId: etudiant.id,
      toRole: "Etudiant",
      subject: "Rapport validé",
      templateName: "rapport_validated",
      templateData: {
        etudiantPrenom: etudiant.prenom,
        encadrantPrenom: email.split('@')[0],
        encadrantNom: '',
        institution: "Encadrants",
        encadrantType: "académique et professionnel"
      },
      message: "Votre rapport a été validé par les deux encadrants."
    });
  }
};

exports.commenterRapport = async (email, rapportId, commentaire) => {
  await db.execute(
    `INSERT INTO CommentaireRapport (rapportId, commentaire)
     VALUES (?, ?)`, [rapportId, commentaire]);

  const [[etudiant]] = await db.execute(
    "SELECT E.prenom, E.nom, E.id FROM Etudiant E JOIN RapportStage R ON E.id = R.etudiantId WHERE R.id = ?",
    [rapportId]
  );
  if (!etudiant) return;

  await notifyUser({
    toId: etudiant.id,
    toRole: "Etudiant",
    subject: "Nouveau commentaire reçu sur votre rapport",
    templateName: "commentaire",
    templateData: {
      etudiantPrenom: etudiant.prenom,
      encadrantPrenom: email.split('@')[0],
      encadrantNom: '',
      commentaire,
      lienRapport: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard`
    },
    message: `Un encadrant a laissé un commentaire sur votre rapport.`
  });
};

exports.getCommentairesRapport = async (rapportId) => {
  const [rows] = await db.execute(
    "SELECT * FROM CommentaireRapport WHERE rapportId = ? ORDER BY date_envoi DESC", [rapportId]);
  return rows;
};

exports.getRapportsAValider = async (email, role) => {
  const table = role === "EncadrantAcademique" ? "EncadrantAcademique" : "EncadrantProfessionnel";
  const [[encadrant]] = await db.execute(`SELECT id FROM ${table} WHERE email = ?`, [email]);
  if (!encadrant) throw new Error("Encadrant introuvable");

  const [rows] = await db.execute(`
    SELECT r.id, r.fichier, e.nom AS nomEtudiant, e.prenom AS prenomEtudiant
    FROM RapportStage r
    JOIN Stage s ON r.stageId = s.id
    JOIN Etudiant e ON s.etudiantId = e.id
    WHERE s.encadrant${role === "EncadrantAcademique" ? "Academique" : "Professionnel"}Id = ?`, [encadrant.id]);

  return rows;
};

exports.getMesRapports = async (email) => {
  const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email = ?", [email]);
  if (!etudiant) throw new Error("Étudiant introuvable pour l'email " + email);

  const [rows] = await db.execute(
    `SELECT * FROM RapportStage WHERE etudiantId = ? ORDER BY dateSoumission DESC`,
    [etudiant.id]
  );
  return rows;
};
