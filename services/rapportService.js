const db = require("../config/db");
const path = require("path");
const notificationService = require("./notificationService");
const attestationService = require("./attestationService");

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



// Fonction utilitaire pour récupérer nom utilisateur
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

exports.validerParTier = async (rapportId, tierId) => {
  const [[rapport]] = await db.execute(`
    SELECT rs.*, s.id AS stageId
    FROM RapportStage rs
    JOIN Stage s ON s.id = rs.stageId
    WHERE rs.id = ?
  `, [rapportId]);

  if (!rapport) throw new Error("Rapport introuvable.");

  const [tiers] = await db.execute(`
    SELECT * FROM TierDebloqueur WHERE id = ?
  `, [tierId]);

  if (!tiers.length) throw new Error("Tier introuvable.");
  const tier = tiers[0];

  let colonneTier = "", colonneStatut = "", colonneEncadrantStatut = "", role = "", action = "";

  if (tier.structureType === 'universite' && rapport.tierIntervenantAcademiqueId == tierId) {
    colonneTier = "tierIntervenantAcademiqueId";
    colonneStatut = "statutAcademique";
    colonneEncadrantStatut = "statutProfessionnel";
    role = "TierDebloqueur";
    action = "Validation académique par tier";
  } else if (tier.structureType === 'entreprise' && rapport.tierIntervenantProfessionnelId == tierId) {
    colonneTier = "tierIntervenantProfessionnelId";
    colonneStatut = "statutProfessionnel";
    colonneEncadrantStatut = "statutAcademique";
    role = "TierDebloqueur";
    action = "Validation professionnelle par tier";
  } else {
    throw new Error("Aucune validation requise ou tier non autorisé à intervenir.");
  }

  // Marquer comme validé par ce Tier
  await db.execute(`
    UPDATE RapportStage 
    SET ${colonneStatut} = TRUE
    WHERE id = ?
  `, [rapportId]);

  // Historique
  await historiqueService.logAction({
    rapportId,
    stageId: rapport.stageId,
    utilisateurId: tierId,
    role,
    action,
    commentaire: "Validation par tier débloqueur",
    origine: "tier"
  });

  // Vérifier si les deux validations (académique ET pro) sont faites
  const [updatedRapportRows] = await db.execute(`
    SELECT statutAcademique, statutProfessionnel 
    FROM RapportStage 
    WHERE id = ?
  `, [rapportId]);

  const updatedRapport = updatedRapportRows[0];
  if (updatedRapport.statutAcademique && updatedRapport.statutProfessionnel) {
    // Générer l’attestation
    await attestationService.genererAttestation({
      stageId: rapport.stageId,
      responsableId: null,
      appreciation: "Validé automatiquement suite à intervention des tiers",
      forcer: true
    });

    // Marquer attestation comme générée
    await db.execute(`
      UPDATE RapportStage 
      SET attestationGeneree = 1 
      WHERE id = ?
    `, [rapportId]);
  }
};


exports.validerParTier = async (rapportId, tierId) => {
  const [[rapport]] = await db.execute(`
    SELECT * FROM RapportStage WHERE id = ?
  `, [rapportId]);

  if (!rapport) throw new Error("Rapport introuvable.");

  const [[tier]] = await db.execute(`SELECT * FROM TierDebloqueur WHERE id = ?`, [tierId]);
  if (!tier) throw new Error("Tier introuvable.");

  let statutField, tierField, roleAction;

  if (tier.structureType === 'universite') {
    statutField = 'statutAcademique';
    tierField = 'tierIntervenantAcademiqueId';
    roleAction = 'Validation académique par tier';
  } else if (tier.structureType === 'entreprise') {
    statutField = 'statutProfessionnel';
    tierField = 'tierIntervenantProfessionnelId';
    roleAction = 'Validation professionnelle par tier';
  } else {
    throw new Error("Structure Tier inconnue.");
  }

  if (rapport[statutField]) {
    throw new Error("Rapport déjà validé pour ce statut.");
  }

  // Validation explicite du rapport par le tier
  await db.execute(`
    UPDATE RapportStage
    SET ${statutField} = TRUE, ${tierField} = ?
    WHERE id = ?
  `, [tierId, rapportId]);

  await historiqueService.logAction({
    rapportId,
    utilisateurId: tierId,
    role: "TierDebloqueur",
    action: roleAction,
    commentaire: "Intervention tier suite à retard",
    origine: "tier"
  });

  // Vérifier explicitement si les deux validations sont désormais effectuées
  const [[updatedRapport]] = await db.execute(`
    SELECT statutAcademique, statutProfessionnel, stageId
    FROM RapportStage WHERE id = ?
  `, [rapportId]);

  if (updatedRapport.statutAcademique && updatedRapport.statutProfessionnel) {
    await attestationService.genererAttestation({
      stageId: updatedRapport.stageId,
      responsableId: null, 
      appreciation: "Validé automatiquement suite à intervention des tiers",
      forcer: true
    });

    await db.execute(`
      UPDATE RapportStage SET attestationGeneree = TRUE WHERE id = ?
    `, [rapportId]);

    await historiqueService.logAction({
      rapportId,
      utilisateurId: null,
      role: 'System',
      action: 'Attestation générée automatiquement (intervention tiers)',
      origine: 'automatique'
    });
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
       r.statutAcademique, r.statutProfessionnel,
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



//
/* -----------------------------------------------------------
 *  Après J+10 : bascule le rapport vers le(s) Tier(s) inactifs
 *  ---------------------------------------------------------*/
const notifierTier = async (tierId, type, idRapport, prenomEtu, nomEtu) =>
  notificationService.notifyUser({
    toId: tierId,
    toRole: 'TierDebloqueur',
    subject: `Rapport ${idRapport} à valider (${type})`,
    templateName: 'tier_intervention',
    templateData: {
      etudiantPrenom: prenomEtu,
      etudiantNom: nomEtu,
      identifiantRapport: idRapport,
      dashboardUrl: buildUrl('/login')
    },
    message: `Le rapport ${idRapport} n'est pas validé depuis 10 jours. Intervention tier requise (${type}).`
  });

exports.checkForTierIntervention = async () => {
  const [rapports] = await db.execute(`
    SELECT 
      r.id AS rapportId,
      r.identifiantRapport,
      r.statutAcademique,
      r.statutProfessionnel,
      r.tierIntervenantAcademiqueId,
      r.tierIntervenantProfessionnelId,
      s.id AS stageId,
      s.dateFin,
      e.prenom, e.nom,
      ea.universiteId AS encUniId,
      ep.entrepriseId AS encEntId
    FROM RapportStage r
    JOIN Stage s ON s.id = r.stageId
    JOIN Etudiant e ON e.id = s.etudiantId
    LEFT JOIN EncadrantAcademique ea ON ea.id = s.encadrantAcademiqueId
    LEFT JOIN EncadrantProfessionnel ep ON ep.id = s.encadrantProfessionnelId
    WHERE DATEDIFF(CURDATE(), s.dateFin) > 10
  `);

  console.log(`[CRON] ${rapports.length} rapports à vérifier pour intervention Tier.`);

  for (const rep of rapports) {
    // Si déjà doublement validé
    if (rep.statutAcademique && rep.statutProfessionnel) continue;

    // Université
    if (!rep.statutAcademique && !rep.tierIntervenantAcademiqueId) {
      if (rep.encUniId) {
        const [[tierUni]] = await db.execute(`
          SELECT id FROM TierDebloqueur
          WHERE structureType = 'universite' AND universiteId = ?
          LIMIT 1
        `, [rep.encUniId]);

        if (tierUni) {
          await db.execute(`
            UPDATE RapportStage
            SET tierIntervenantAcademiqueId = ?
            WHERE id = ?
          `, [tierUni.id, rep.rapportId]);

          console.log(`[Tier] Intervention demandée (universite) pour rapport ${rep.identifiantRapport}`);

          await notifierTier(
            tierUni.id, 'universite',
            rep.identifiantRapport,
            rep.prenom, rep.nom
          );

          await historiqueService.logAction({
            rapportId: rep.rapportId,
            stageId: rep.stageId,
            utilisateurId: tierUni.id,
            role: 'TierDebloqueur',
            action: 'Attribution automatique (académique)',
            commentaire: 'Encadrant académique hors délai',
            origine: 'automatique'
          });
        } else {
          console.warn(`[Tier] Aucun tier universitaire trouvé pour universiteId=${rep.encUniId}`);
        }
      } else {
        console.warn(`[Tier] universiteId NULL (via encadrant) pour rapport ${rep.identifiantRapport}`);
      }
    }

    // Entreprise
    if (!rep.statutProfessionnel && !rep.tierIntervenantProfessionnelId) {
      if (rep.encEntId) {
        const [[tierEnt]] = await db.execute(`
          SELECT id FROM TierDebloqueur
          WHERE structureType = 'entreprise' AND entrepriseId = ?
          LIMIT 1
        `, [rep.encEntId]);

        if (tierEnt) {
          await db.execute(`
            UPDATE RapportStage
            SET tierIntervenantProfessionnelId = ?
            WHERE id = ?
          `, [tierEnt.id, rep.rapportId]);

          console.log(`[Tier] Intervention demandée (entreprise) pour rapport ${rep.identifiantRapport}`);

          await notifierTier(
            tierEnt.id, 'entreprise',
            rep.identifiantRapport,
            rep.prenom, rep.nom
          );

          await historiqueService.logAction({
            rapportId: rep.rapportId,
            stageId: rep.stageId,
            utilisateurId: tierEnt.id,
            role: 'TierDebloqueur',
            action: 'Attribution automatique (professionnel)',
            commentaire: 'Encadrant professionnel hors délai',
            origine: 'automatique'
          });
        } else {
          console.warn(`[Tier] Aucun tier entreprise trouvé pour entrepriseId=${rep.encEntId}`);
        }
      } else {
        console.warn(`[Tier] entrepriseId NULL (via encadrant) pour rapport ${rep.identifiantRapport}`);
      }
    }
  }
};


//
exports.getRapportsPourTier = async (tierId) => {
  const [tiers] = await db.execute(`
    SELECT structureType, universiteId, entrepriseId 
    FROM TierDebloqueur 
    WHERE id = ?
  `, [tierId]);

  if (!tiers.length) throw new Error("Tier introuvable.");
  const tier = tiers[0];

  let condition = "";
  
  if (tier.structureType === "universite") {
    condition = `
      rs.tierIntervenantAcademiqueId = ${tierId}
      AND rs.statutAcademique = FALSE
    `;
  } else {
    condition = `
      rs.tierIntervenantProfessionnelId = ${tierId}
      AND rs.statutProfessionnel = FALSE
    `;
  }

  const [rapports] = await db.execute(`
    SELECT rs.*, s.titre, s.dateFin, 
           et.prenom AS prenomEtudiant, et.nom AS nomEtudiant
    FROM RapportStage rs
    JOIN Stage s ON s.id = rs.stageId
    JOIN Etudiant et ON et.id = s.etudiantId
    WHERE ${condition}
  `);

  // Tous ces rapports sont uniquement ceux assignés au tier explicitement en attente de validation
  const enAttente = rapports;

  // Rapports déjà validés explicitement par le tier
  const [valides] = await db.execute(`
    SELECT rs.*, s.titre, s.dateFin, 
           et.prenom AS prenomEtudiant, et.nom AS nomEtudiant
    FROM RapportStage rs
    JOIN Stage s ON s.id = rs.stageId
    JOIN Etudiant et ON et.id = s.etudiantId
    WHERE ${tier.structureType === 'universite'
      ? `rs.tierIntervenantAcademiqueId = ${tierId} AND rs.statutAcademique = TRUE`
      : `rs.tierIntervenantProfessionnelId = ${tierId} AND rs.statutProfessionnel = TRUE`}
  `);

  return { enAttente, valides };
};


//
exports.getRapportsPourEncadrant = async (encadrantId, type, search = '') => {
  let condition = type === 'academique' ? 's.encadrantAcademiqueId = ?' : 's.encadrantProfessionnelId = ?';
  let searchClause = search ? 'AND (s.identifiant_unique LIKE ? OR rs.identifiantRapport LIKE ?)' : '';

  const [rapports] = await db.execute(
    `
    SELECT rs.*, s.identifiant_unique AS stageIdentifiant, e.nom, e.prenom
    FROM RapportStage rs
    JOIN Stage s ON s.id = rs.stageId
    JOIN Etudiant e ON e.id = rs.etudiantId
    WHERE ${condition} ${searchClause}
    `,
    search ? [encadrantId, `%${search}%`, `%${search}%`] : [encadrantId]
  );

  return rapports;
};
