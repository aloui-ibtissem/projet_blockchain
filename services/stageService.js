const db = require("../config/db");
const { genererIdentifiantStage } = require("../utils/identifiantUtils");
const notificationService = require("./notificationService");
const historiqueService = require("./historiqueService");
const { buildUrl } = require("../utils/urlUtils");

//1proposersujet
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

  if (!etudiant || !aca || !pro || !entreprise || !universite) throw new Error("Données manquantes pour la création de la proposition.");

  const [result] = await db.execute(
    `INSERT INTO SujetStage (titre, description, dateDebut, dateFin, encadrantAcademiqueId, encadrantProfessionnelId, etudiantId, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'en attente')`,
    [sujet, objectifs, dateDebut, dateFin, aca.id, pro.id, etudiant.id]
  );

  const baseUrl = process.env.PUBLIC_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  const baseData = {
    etudiantPrenom: etudiant.prenom,
    etudiantNom: etudiant.nom,
    titreStage: sujet,
    dateProposition: new Date().toLocaleDateString("fr-FR"),
    baseUrl,
    year: new Date().getFullYear()
  };

  await notificationService.notifyUser({
    toId: aca.id,
    toRole: "EncadrantAcademique",
    subject: "Nouvelle proposition de stage",
    templateName: "stage_proposed",
    templateData: { ...baseData, destinatairePrenom: aca.prenom },
    message: "Un étudiant a proposé un sujet de stage à valider."
  });

  await notificationService.notifyUser({
    toId: pro.id,
    toRole: "EncadrantProfessionnel",
    subject: "Nouvelle proposition de stage",
    templateName: "stage_proposed",
    templateData: { ...baseData, destinatairePrenom: pro.prenom },
    message: "Un étudiant a proposé un sujet de stage à valider."
  });

  await historiqueService.logAction({
    rapportId: null,
    utilisateurId: etudiant.id,
    role: "Etudiant",
    action: "Proposition de stage",
    commentaire: `Sujet : ${sujet}`,
    origine: "manuelle"
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
    await db.execute(`UPDATE SujetStage SET ${refusCol} = TRUE, status = 'refusé' WHERE id = ?`, [sujetId]);

    const [[sujet]] = await db.execute("SELECT etudiantId, titre FROM SujetStage WHERE id = ?", [sujetId]);
    const [[encadrant]] = await db.execute(`SELECT id FROM ${role} WHERE email = ?`, [email]);

    await historiqueService.logAction({
      rapportId: null,
      utilisateurId: encadrant.id,
      role: role,
      action: "Refus de sujet",
      commentaire: `Sujet : ${sujet.titre}, commentaire : ${commentaire || 'non spécifié'}`,
      origine: "manuelle"
    });

    return;
  }

  const [[sujet]] = await db.execute("SELECT * FROM SujetStage WHERE id = ?", [sujetId]);

  if (sujet.aca_validé && sujet.pro_validé) {
    await exports.creerStageDepuisSujet(sujet);
  } else {
    const [[etudiant]] = await db.execute("SELECT prenom, nom, email FROM Etudiant WHERE id = ?", [sujet.etudiantId]);
    const encadrantCol = role === "EncadrantAcademique" ? "encadrantAcademiqueId" : "encadrantProfessionnelId";
    const [[encadrant]] = await db.execute(`SELECT prenom, nom FROM ${role} WHERE id = ?`, [sujet[encadrantCol]]);

    await notificationService.notifyUser({
      toId: sujet.etudiantId,
      toRole: "Etudiant",
      subject: "Validation partielle de votre sujet de stage",
      templateName: "stage_partial_validation",
      templateData: {
        etudiantPrenom: etudiant.prenom,
        encadrantPrenom: encadrant.prenom,
        encadrantNom: encadrant.nom,
        titreStage: sujet.titre,
        dashboardUrl: buildUrl("/etudiant")
      },
      message: `Votre sujet a été validé par un encadrant. En attente de l'autre validation.`
    });
  }

  const [[encadrant]] = await db.execute(`SELECT id FROM ${role} WHERE email = ?`, [email]);

  await historiqueService.logAction({
    rapportId: null,
    utilisateurId: encadrant.id,
    role,
    action: "Validation de sujet",
    commentaire: `Sujet : ${sujet.titre}`,
    origine: "manuelle"
  });
};
//
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

  // Archiver les anciens stages
  await db.execute(
    "UPDATE Stage SET estHistorique = TRUE WHERE etudiantId = ? AND estHistorique = FALSE",
    [sujet.etudiantId]
  );

  // Création du stage actuel
  const [result] = await db.execute(
    `INSERT INTO Stage (etudiantId, encadrantAcademiqueId, encadrantProfessionnelId, entrepriseId, titre, dateDebut, dateFin, intervalleValidation, identifiant_unique, etat, estHistorique)
     VALUES (?, ?, ?, ?, ?, ?, ?, 10, ?, 'en attente', FALSE)`,
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

  // Mise à jour du sujet
  await db.execute(
    "UPDATE SujetStage SET status='validé', stageId=? WHERE id=?",
    [result.insertId, sujet.id]
  );

  // Notification à l’étudiant
  await notificationService.notifyUser({
    toId: sujet.etudiantId,
    toRole: "Etudiant",
    subject: `Votre stage est créé : ${identifiant}`,
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
    message: `Votre stage est officiellement créé avec l’identifiant : ${identifiant}.`
  });

  // Historique
  await historiqueService.logAction({
    rapportId: null,
    utilisateurId: sujet.etudiantId,
    role: "Etudiant",
    action: "Création du stage suite à validation du sujet",
    commentaire: `Stage : ${identifiant}, ${sujet.titre}`,
    origine: "automatique"
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
            e.prenom AS etudiantPrenom, e.nom AS etudiantNom,
            s.${col === "encadrantAcademiqueId" ? "aca_validé" : "pro_validé"} AS dejaValide
     FROM SujetStage s
     JOIN Etudiant e ON s.etudiantId = e.id
     WHERE s.${col} = ? AND s.status = 'en attente'`,
    [encadrant.id]
  );

  return rows.map((r) => ({
    ...r,
    etudiantNomComplet: `${r.etudiantPrenom} ${r.etudiantNom}`,
    dejaValide: !!r.dejaValide
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
    `SELECT S.*, 
            E.nom AS entrepriseNom,
            A.prenom AS acaPrenom, A.nom AS acaNom,
            P.prenom AS proPrenom, P.nom AS proNom,
            Etu.prenom AS etuPrenom, Etu.nom AS etuNom
     FROM Stage S
     JOIN Entreprise E ON S.entrepriseId = E.id
     JOIN EncadrantAcademique A ON S.encadrantAcademiqueId = A.id
     JOIN EncadrantProfessionnel P ON S.encadrantProfessionnelId = P.id
     JOIN Etudiant Etu ON S.etudiantId = Etu.id
     WHERE S.${col} = ? AND S.estHistorique = FALSE
     ORDER BY S.dateDebut DESC`,
    [user.id]
  );

  return rows;
};
//
// 6
exports.getCurrentStageByEmail = async (email) => {
  const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email = ?", [email]);
  if (!etudiant) return null;

 const [rows] = await db.execute(`
  SELECT 
    S.*, 
    E.nom AS entreprise,
    A.prenom AS acaPrenom,
    A.nom AS acaNom,
    A.email AS acaEmail,
    P.prenom AS proPrenom,
    P.nom AS proNom,
    P.email AS proEmail
  FROM Stage S
  JOIN Entreprise E ON S.entrepriseId = E.id
  JOIN EncadrantAcademique A ON S.encadrantAcademiqueId = A.id
  JOIN EncadrantProfessionnel P ON S.encadrantProfessionnelId = P.id
  WHERE S.etudiantId = ? AND S.estHistorique = FALSE
`, [etudiant.id]);


  return rows[0] || null;
};



// ===============================
// 7. Liste des stages historiques (étudiant)
// ===============================


exports.getStagesHistoriquesByEmail = async (email, search = "") => {
  const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email = ?", [email]);
  if (!etudiant) return [];

  const extra = search
    ? `AND (S.identifiant_unique LIKE ? OR R.identifiantRapport LIKE ?)`
    : "";
  const params = search
    ? [etudiant.id, `%${search}%`, `%${search}%`]
    : [etudiant.id];

  const [rows] = await db.execute(
    `
    SELECT 
      S.*, 
      E.nom AS entreprise,
      A.prenom AS acaPrenom, A.nom AS acaNom,
      P.prenom AS proPrenom, P.nom AS proNom,
      R.identifiantRapport, R.fichier,
      A2.identifiant AS attestationId, A2.ipfsUrl
    FROM Stage S
    JOIN Entreprise E ON S.entrepriseId = E.id
    JOIN EncadrantAcademique A ON S.encadrantAcademiqueId = A.id
    JOIN EncadrantProfessionnel P ON S.encadrantProfessionnelId = P.id
    LEFT JOIN RapportStage R ON R.stageId = S.id
    LEFT JOIN Attestation A2 ON A2.stageId = S.id
    WHERE S.etudiantId = ? AND S.estHistorique = TRUE ${extra}
    ORDER BY S.dateDebut DESC
    `,
    params
  );

  return rows;
};


