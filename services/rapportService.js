const db = require("../config/db");
const path = require("path");
const notificationService = require("./notificationService");
const {
  validateAsEncadrant,
  validateAsTier,
  confirmDoubleValidation
} = require("../utils/blockchainUtils");

const { hashFile } = require("../utils/hashUtils");
const { genererIdentifiantRapport } = require("../utils/identifiantUtils");

const baseUrl = process.env.PUBLIC_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
const { buildUrl } = require("../utils/urlUtils");
const historiqueService = require("./historiqueService");



const getUtilisateurNom = async (id, role) => {
  const tableMap = {
    EncadrantAcademique: "EncadrantAcademique",
    EncadrantProfessionnel: "EncadrantProfessionnel",
    ResponsableEntreprise: "ResponsableEntreprise",
    ResponsableUniversitaire: "ResponsableUniversitaire",
    Etudiant: "Etudiant",
    TierDebloqueur: "TierDebloqueur",
  };
  const table = tableMap[role];
  const [[user]] = await db.execute(`SELECT prenom, nom FROM ${table} WHERE id = ?`, [id]);
  return user;
};

exports.soumettreRapport = async (email, fichier, cibles = []) => {
  if (!fichier?.filename) throw new Error("Fichier non fourni.");
  if (!Array.isArray(cibles) || cibles.length === 0) throw new Error("Aucun encadrant cible précisé.");

  const [[etudiant]] = await db.execute("SELECT id, prenom, nom FROM Etudiant WHERE email = ?", [email]);
  const [[stage]] = await db.execute("SELECT * FROM Stage WHERE etudiantId = ?", [etudiant.id]);

  const rapportPath = fichier.filename;
  //
  const fs = require("fs");
const fullPath = path.join(__dirname, "../uploads", rapportPath);
if (!fs.existsSync(fullPath)) {
  throw new Error(`Fichier non trouvé à l’emplacement : ${fullPath}`);
}
const rapportHash = await hashFile(fullPath);

  


  const [existing] = await db.execute("SELECT id, identifiantRapport FROM RapportStage WHERE stageId = ?", [stage.id]);

  let identifiantRapport;
  if (existing.length > 0) {
    identifiantRapport = existing[0].identifiantRapport;
    await db.execute(`
      UPDATE RapportStage 
      SET fichier = ?, fichierHash = ?, dateSoumission = NOW()
      WHERE stageId = ?
    `, [rapportPath, rapportHash, stage.id]);
  } else {
    identifiantRapport = await genererIdentifiantRapport(etudiant.id);
    await db.execute(`
      INSERT INTO RapportStage 
      (stageId, etudiantId, fichier, fichierHash, dateSoumission, 
       statutAcademique, statutProfessionnel, attestationGeneree, identifiantRapport)
      VALUES (?, ?, ?, ?, NOW(), FALSE, FALSE, FALSE, ?)
    `, [stage.id, etudiant.id, rapportPath, rapportHash, identifiantRapport]);
  }
  await historiqueService.logAction({
  rapportId: existing.length > 0 ? existing[0].id : null,
  utilisateurId: etudiant.id,
  role: "Etudiant",
  action: "Soumission de rapport",
  commentaire: `Fichier : ${rapportPath}`,
  origine: "manuelle"
});


  const encadrants = {
    EncadrantAcademique: stage.encadrantAcademiqueId,
    EncadrantProfessionnel: stage.encadrantProfessionnelId,
  };

  for (const role of cibles) {
    const id = encadrants[role];
    if (!id) continue;
    const u = await getUtilisateurNom(id, role);
    await notificationService.notifyUser({
      toId: id,
      toRole: role,
      subject: "Rapport de stage soumis",
      templateName: "rapport_submitted",
      templateData: {
        encadrantPrenom: u.prenom,
        encadrantNom: u.nom,
        etudiantPrenom: etudiant.prenom,
        etudiantNom: etudiant.nom,
        titreStage: stage.titre,
        dateSoumission: new Date().toLocaleDateString(),
        rapportUrl: `${baseUrl}/uploads/${rapportPath}`,
        dashboardUrl: buildUrl("/login"),

      },
      message: `L'étudiant ${etudiant.prenom} ${etudiant.nom} a soumis son rapport de stage.`
    });
  }

  return { identifiantRapport };
};

exports.validerRapport = async (email, role, rapportId) => {
  const champ = role === "EncadrantAcademique" ? "statutAcademique" : "statutProfessionnel";
  const blockchainRole = role === "EncadrantAcademique" ? "ACA" : "PRO";

  const [[encadrant]] = await db.execute(`SELECT id, prenom, nom FROM ${role} WHERE email = ?`, [email]);
  const [[rapport]] = await db.execute("SELECT * FROM RapportStage WHERE id = ?", [rapportId]);
  const [[stage]] = await db.execute("SELECT * FROM Stage WHERE id = ?", [rapport.stageId]);
  const [[etudiant]] = await db.execute("SELECT prenom, nom FROM Etudiant WHERE id = ?", [rapport.etudiantId]);

  if ((champ === "statutAcademique" && rapport.statutAcademique) ||
      (champ === "statutProfessionnel" && rapport.statutProfessionnel)) {
    throw new Error("Ce rapport est déjà validé par cet encadrant.");
  }

  await db.execute(`UPDATE RapportStage SET ${champ} = TRUE WHERE id = ?`, [rapportId]);
  await validateAsEncadrant(rapport.identifiantRapport, blockchainRole);
  await historiqueService.logAction({
  rapportId: rapportId,
  utilisateurId: encadrant.id,
  role,
  action: `Validation du rapport`,
  commentaire: `Rapport : ${rapport.identifiantRapport}`,
  origine: "manuelle"
});


  await notificationService.notifyUser({
    toId: rapport.etudiantId,
    toRole: "Etudiant",
    subject: "Rapport validé",
    templateName: champ === "statutAcademique" ? "rapport_validated_academique" : "rapport_validated_professionnel",
    templateData: {
      etudiantPrenom: etudiant.prenom,
       etudiantNom: etudiant.nom,
      encadrantPrenom: encadrant.prenom,
      encadrantNom: encadrant.nom,
      titreStage:stage.titre,
      rapportUrl: `${baseUrl}/uploads/${rapport.fichier}`,
       dashboardUrl: buildUrl("/login")
    },
    message: `Votre rapport a été validé par ${encadrant.prenom} ${encadrant.nom}.`
  });

  const [[refreshed]] = await db.execute("SELECT statutAcademique, statutProfessionnel, attestationGeneree FROM RapportStage WHERE id = ?", [rapportId]);

  if (refreshed.statutAcademique && refreshed.statutProfessionnel && !refreshed.attestationGeneree) {
    await confirmDoubleValidation(rapport.identifiantRapport);

    const [[responsable]] = await db.execute(
      `SELECT id, prenom, nom FROM ResponsableEntreprise WHERE entrepriseId = ? LIMIT 1`,
      [stage.entrepriseId]
    );

    if (responsable) {
      await notificationService.notifyUser({
        toId: responsable.id,
        toRole: "ResponsableEntreprise",
        subject: "Attestation à générer",
        templateName: "attestation_ready",
        templateData: {
          etudiantPrenom: etudiant.prenom,
          etudiantNom: etudiant.nom,
          titreStage: stage.titre,
          identifiantRapport: rapport.identifiantRapport,
          attestationFormUrl: `${baseUrl}/entreprise/attestation/${rapport.identifiantRapport}`,
           dashboardUrl: buildUrl("/login")
        },
        message: `L'attestation de ${etudiant.prenom} ${etudiant.nom} est prête à être générée.`
      });
    }
  }
};

exports.validerParTier = async (rapportId, tierId, structureType) => {
  const [[rapport]] = await db.execute("SELECT * FROM RapportStage WHERE id = ?", [rapportId]);
  const [[stage]] = await db.execute("SELECT * FROM Stage WHERE id = ?", [rapport.stageId]);
  const [[tier]] = await db.execute("SELECT prenom, nom FROM TierDebloqueur WHERE id = ?", [tierId]);
  const [[etudiant]] = await db.execute("SELECT prenom, nom FROM Etudiant WHERE id = ?", [rapport.etudiantId]);

  let champ;
  if (!rapport.statutAcademique) champ = "statutAcademique";
  else if (!rapport.statutProfessionnel) champ = "statutProfessionnel";
  else throw new Error("Les deux validations ont déjà été faites.");

  await db.execute(`UPDATE RapportStage SET ${champ} = TRUE WHERE id = ?`, [rapportId]);
  await validateAsTier(rapport.identifiantRapport, structureType);
  //
  await historiqueService.logAction({
  rapportId: rapportId,
  utilisateurId: tierId,
  role: "TierDebloqueur",
  action: "Validation automatique (par tier)",
  commentaire: `Raison : Encadrant inactif. Rapport : ${rapport.identifiantRapport}`,
  origine: "automatique"
});


  await notificationService.notifyUser({
    toId: rapport.etudiantId,
    toRole: "Etudiant",
    subject: "Validation par un tiers",
    templateName: "timeout_validated",
    templateData: {
      etudiantPrenom: etudiant.prenom,
      etudiantNom: etudiant.nom,
      tierPrenom: tier.prenom,
      tierNom: tier.nom
    },
    message: "Votre rapport a été validé par un tiers suite à un dépassement de délai."
  });

  const [[refreshed]] = await db.execute("SELECT statutAcademique, statutProfessionnel, attestationGeneree FROM RapportStage WHERE id = ?", [rapportId]);

  if (refreshed.statutAcademique && refreshed.statutProfessionnel && !refreshed.attestationGeneree) {
    await confirmDoubleValidation(rapport.identifiantRapport);

    const [[responsable]] = await db.execute(
      `SELECT id, prenom, nom FROM ResponsableEntreprise WHERE entrepriseId = ? LIMIT 1`,
      [stage.entrepriseId]
    );

    if (responsable) {
      await notificationService.notifyUser({
        toId: responsable.id,
        toRole: "ResponsableEntreprise",
        subject: "Attestation à générer",
        templateName: "attestation_ready",
        templateData: {
          etudiantPrenom: etudiant.prenom,
          etudiantNom: etudiant.nom,
          titreStage: stage.titre,
          identifiantRapport: rapport.identifiantRapport,
dashboardUrl: buildUrl("/login")        },
        message: `L'attestation de ${etudiant.prenom} ${etudiant.nom} est prête à être générée.`
      });
    }
  }
};

exports.commenterRapport = async (email, rapportId, commentaire) => {
  const [[rapport]] = await db.execute("SELECT * FROM RapportStage WHERE id = ?", [rapportId]);
  const [[stage]] = await db.execute("SELECT * FROM Stage WHERE id = ?", [rapport.stageId]);
  const [[etudiant]] = await db.execute("SELECT id, prenom FROM Etudiant WHERE id = ?", [rapport.etudiantId]);

  const [[aca]] = await db.execute("SELECT id, prenom, nom FROM EncadrantAcademique WHERE email = ?", [email]);
  const [[pro]] = await db.execute("SELECT id, prenom, nom FROM EncadrantProfessionnel WHERE email = ?", [email]);

  let validé = false;
  let encadrant = null;
  if (aca && aca.id === stage.encadrantAcademiqueId) {
    validé = rapport.statutAcademique;
    encadrant = aca;
  }
  if (pro && pro.id === stage.encadrantProfessionnelId) {
    validé = rapport.statutProfessionnel;
    encadrant = pro;
  }
  if (!encadrant) throw new Error("Encadrant non autorisé.");
  if (validé) throw new Error("Impossible de commenter après validation.");

  await db.execute("INSERT INTO CommentaireRapport (rapportId, commentaire) VALUES (?, ?)", [rapportId, commentaire]);
//
await historiqueService.logAction({
  rapportId,
  utilisateurId: encadrant.id,
  role: aca ? "EncadrantAcademique" : "EncadrantProfessionnel",
  action: "Ajout de commentaire",
  commentaire: commentaire,
  origine: "manuelle"
});

  await notificationService.notifyUser({
  toId: etudiant.id,
  toRole: "Etudiant",
  subject: "Commentaire reçu",
  templateName: "commentaire",
  templateData: {
    etudiantPrenom: etudiant.prenom,
    etudiantNom: etudiant.nom,
    encadrantPrenom: encadrant.prenom,
    encadrantNom: encadrant.nom,
    commentaire,
    dashboardUrl: buildUrl("/login")
  },
  message: `Un commentaire a été ajouté sur votre rapport.`
});
};

//

exports.getRapportsAValider = async (email, role) => {
  const encadrantTable = role === "EncadrantAcademique" ? "EncadrantAcademique" : "EncadrantProfessionnel";
  const statutField = role === "EncadrantAcademique" ? "statutAcademique" : "statutProfessionnel";
  const stageField = role === "EncadrantAcademique" ? "encadrantAcademiqueId" : "encadrantProfessionnelId";

  const [[encadrant]] = await db.execute(
    `SELECT id FROM ${encadrantTable} WHERE email = ?`,
    [email]
  );

  if (!encadrant) throw new Error("Encadrant introuvable.");

  const [rows] = await db.execute(
    `
    SELECT r.id, r.fichier, r.identifiantRapport, r.dateSoumission,
           e.nom AS nomEtudiant, e.prenom AS prenomEtudiant,
           s.titre AS titreStage
    FROM RapportStage r
    JOIN Stage s ON r.stageId = s.id
    JOIN Etudiant e ON r.etudiantId = e.id
    WHERE s.${stageField} = ?
    `,
    [encadrant.id]
  );

  // Découpage : en attente VS historiques
  return {
    enAttente: rows.filter(r => !r[statutField]),
    valides: rows.filter(r => r[statutField])
  };
};
//
exports.getMesRapports = async (email) => {
  const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email = ?", [email]);
  if (!etudiant) throw new Error("Étudiant introuvable.");

  const [rows] = await db.execute(`
    SELECT 
      r.id, 
      r.identifiantRapport, 
      r.fichier, 
      r.dateSoumission,
      r.statutAcademique, 
      r.statutProfessionnel,
      s.identifiant_unique AS identifiantStage,
      s.titre AS titreStage
    FROM RapportStage r
    JOIN Stage s ON r.stageId = s.id
    WHERE r.etudiantId = ?
    ORDER BY r.dateSoumission DESC
  `, [etudiant.id]);

  // Formatage du lien fichier directement pour React
  const baseUrl = process.env.PUBLIC_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  return rows.map(r => ({
    ...r,
    lienFichier: `${baseUrl}/uploads/${r.fichier}`
  }));
};






// Nouvelle fonction de rappel automatique
exports.remindersCheck = async () => {
  const [stages] = await db.execute(`
    SELECT s.id, s.dateFin, s.titre, s.etudiantId, e.prenom, e.nom
    FROM Stage s
    LEFT JOIN RapportStage r ON s.id = r.stageId
    JOIN Etudiant e ON s.etudiantId = e.id
    WHERE r.id IS NULL AND DATEDIFF(s.dateFin, CURDATE()) <= 7 AND DATEDIFF(s.dateFin, CURDATE()) >= 0
  `);

  for (const stage of stages) {
    await notificationService.notifyUser({
      toId: stage.etudiantId,
      toRole: "Etudiant",
      subject: "Rappel : Soumission de votre rapport",
      templateName: "reminder_submission",
      templateData: {
        etudiantPrenom: stage.prenom,
        etudiantNom: stage.nom,
        titreStage: stage.titre,
        soumissionUrl: buildUrl("/etudiant"),
        appName: "StageChain",
        year: new Date().getFullYear(),
        homeUrl: buildUrl("/"),
        loginUrl: buildUrl("/login")
      },
      message: `Rappel automatique : merci de soumettre votre rapport de stage pour "${stage.titre}".`
    });
  }
};

//
exports.remindersValidationCheck = async () => {
  const [rapports] = await db.execute(`
    SELECT r.id, r.identifiantRapport, r.dateSoumission, r.statutAcademique, r.statutProfessionnel,
           s.encadrantAcademiqueId, s.encadrantProfessionnelId, s.titre, s.dateFin,
           e.prenom, e.nom
    FROM RapportStage r
    JOIN Stage s ON r.stageId = s.id
    JOIN Etudiant e ON s.etudiantId = e.id
    WHERE DATEDIFF(CURDATE(), s.dateFin) BETWEEN 7 AND 10
  `);

  for (const r of rapports) {
    if (!r.statutAcademique && r.encadrantAcademiqueId) {
      await notificationService.notifyUser({
        toId: r.encadrantAcademiqueId,
        toRole: "EncadrantAcademique",
        subject: "Rappel de validation rapport",
        templateName: "reminder_validation",
        templateData: {
          encadrantPrenom: "", encadrantNom: "",
          etudiantPrenom: r.prenom,
          etudiantNom: r.nom,
          titreStage: r.titre,
          dashboardUrl: buildUrl("/login")
        },
        message: `Rappel : vous n'avez pas encore validé le rapport de ${r.prenom} ${r.nom}.`
      });
    }

    if (!r.statutProfessionnel && r.encadrantProfessionnelId) {
      await notificationService.notifyUser({
        toId: r.encadrantProfessionnelId,
        toRole: "EncadrantProfessionnel",
        subject: "Rappel de validation rapport",
        templateName: "reminder_validation",
        templateData: {
          encadrantPrenom: "", encadrantNom: "",
          etudiantPrenom: r.prenom,
          etudiantNom: r.nom,
          titreStage: r.titre,
          dashboardUrl: buildUrl("/login")
        },
        message: `Rappel : vous n'avez pas encore validé le rapport de ${r.prenom} ${r.nom}.`
      });
    }
  }
};

//
exports.checkForTierIntervention = async () => {
  const [rapports] = await db.execute(`
    SELECT r.id, r.identifiantRapport, r.statutAcademique, r.statutProfessionnel,
           s.dateFin, s.entrepriseId, s.universiteId, s.id AS stageId,
           s.encadrantAcademiqueId, s.encadrantProfessionnelId,
           e.prenom, e.nom
    FROM RapportStage r
    JOIN Stage s ON r.stageId = s.id
    JOIN Etudiant e ON s.etudiantId = e.id
    WHERE DATEDIFF(CURDATE(), s.dateFin) > 10
      AND (r.statutAcademique = FALSE OR r.statutProfessionnel = FALSE)
  `);

 for (const r of rapports) {
  const interventions = [];

  if (!r.statutAcademique && r.encadrantAcademiqueId) {
    const [[tierUni]] = await db.execute(
      `SELECT id FROM TierDebloqueur WHERE universiteId = ?`, [r.universiteId]
    );
    if (tierUni?.id) interventions.push({ champ: 'statutAcademique', entite: 'universite', tierId: tierUni.id });
  }

  if (!r.statutProfessionnel && r.encadrantProfessionnelId) {
    const [[tierEnt]] = await db.execute(
      `SELECT id FROM TierDebloqueur WHERE entrepriseId = ?`, [r.entrepriseId]
    );
    if (tierEnt?.id) interventions.push({ champ: 'statutProfessionnel', entite: 'entreprise', tierId: tierEnt.id });
  }

  for (const { tierId, entite } of interventions) {
    if (!tierId) {
      console.warn(`Aucun tier trouvé pour ${entite} (rapport: ${r.identifiantRapport})`);
      continue;
    }

    try {
      console.log(`Notification au tier ${entite.toUpperCase()} pour rapport ${r.identifiantRapport}`);

      await notificationService.notifyUser({
        toId: tierId,
        toRole: "TierDebloqueur",
        subject: "Intervention requise",
        templateName: "tier_intervention",
        templateData: {
          etudiantPrenom: r.prenom,
          etudiantNom: r.nom,
          identifiantRapport: r.identifiantRapport,
          dashboardUrl: buildUrl("/tier/rapports")
        },
        message: `Un encadrant n’a pas validé le rapport de ${r.prenom} ${r.nom} à temps. Merci d’intervenir.`
      });

      await historiqueService.logAction({
        rapportId: r.id,
        stageId: r.stageId,
        utilisateurId: tierId,
        role: "TierDebloqueur",
        action: `Demande d’intervention tier`,
        commentaire: `Tier notifié pour rapport ${r.identifiantRapport}`,
        origine: "automatique"
      });

    } catch (err) {
      console.error(`❌ Erreur lors de la notification ou journalisation pour tier ID ${tierId}:`, err.message);
    }
  }
}


//
exports.getRapportsPourTier = async (tierId) => {
  const [[tier]] = await db.execute("SELECT id, universiteId, entrepriseId FROM TierDebloqueur WHERE id = ?", [tierId]);
  if (!tier || (!tier.universiteId && !tier.entrepriseId)) return { enAttente: [], valides: [] };

  const [rows] = await db.execute(`
    SELECT r.id, r.identifiantRapport, r.fichier, r.dateSoumission,
           r.statutAcademique, r.statutProfessionnel,
           e.nom AS nomEtudiant, e.prenom AS prenomEtudiant,
           s.dateFin, s.titre,
           u.nom AS nomUniversite, ent.nom AS nomEntreprise
    FROM RapportStage r
    JOIN Stage s ON r.stageId = s.id
    JOIN Etudiant e ON s.etudiantId = e.id
    LEFT JOIN Entreprise ent ON s.entrepriseId = ent.id
    LEFT JOIN Universite u ON s.universiteId = u.id
    WHERE (
      (s.universiteId = ? AND r.statutAcademique = FALSE)
      OR
      (s.entrepriseId = ? AND r.statutProfessionnel = FALSE)
    )
    OR (
      (s.universiteId = ? AND r.statutAcademique = TRUE)
      OR
      (s.entrepriseId = ? AND r.statutProfessionnel = TRUE)
    )
  `, [tier.universiteId, tier.entrepriseId, tier.universiteId, tier.entrepriseId]);

  return {
    enAttente: rows.filter(r =>
      (tier.universiteId && !r.statutAcademique) ||
      (tier.entrepriseId && !r.statutProfessionnel)
    ),
    valides: rows.filter(r =>
      (tier.universiteId && r.statutAcademique) ||
      (tier.entrepriseId && r.statutProfessionnel)
    )
  };
};
