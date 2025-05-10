// services/rapportService.js
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

const getUtilisateurNom = async (id, role) => {
  const table = {
    EncadrantAcademique: "EncadrantAcademique",
    EncadrantProfessionnel: "EncadrantProfessionnel",
    ResponsableEntreprise: "ResponsableEntreprise",
    ResponsableUniversitaire: "ResponsableUniversitaire",
    Etudiant: "Etudiant",
    TierDebloqueur: "TierDebloqueur",
  }[role];
  if (!table) throw new Error("Rôle non reconnu");
  const [[user]] = await db.execute(`SELECT prenom, nom FROM ${table} WHERE id = ?`, [id]);
  return user;
};

exports.soumettreRapport = async (email, fichier, cibles = []) => {
  if (!fichier || !fichier.filename) throw new Error("Fichier non fourni.");
  if (!Array.isArray(cibles) || cibles.length === 0) throw new Error("Aucun encadrant cible précisé.");

  const [[etudiant]] = await db.execute("SELECT id, prenom, nom FROM Etudiant WHERE email = ?", [email]);
  if (!etudiant) throw new Error("Étudiant introuvable.");

  const [[stage]] = await db.execute("SELECT * FROM Stage WHERE etudiantId = ?", [etudiant.id]);
  if (!stage) throw new Error("Aucun stage trouvé pour cet étudiant.");

  const rapportPath = fichier.filename;
  const rapportHash = hashFile(path.join(__dirname, "../uploads", rapportPath));

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

  const allEncadrants = {
    EncadrantAcademique: stage.encadrantAcademiqueId,
    EncadrantProfessionnel: stage.encadrantProfessionnelId,
  };

  for (const role of cibles) {
    const id = allEncadrants[role];
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
        identifiantStage: stage.identifiant_unique,
        identifiantRapport,
        dateSoumission: new Date().toLocaleDateString(),
        lienRapport: `${process.env.BACKEND_URL || "http://localhost:3000"}/uploads/${rapportPath}`,
      },
      message: `L'étudiant ${etudiant.prenom} ${etudiant.nom} a soumis son rapport de stage.`,
    });
  }

  return { identifiantRapport };
};

exports.validerRapport = async (email, role, rapportId) => {
  const champ = role === "EncadrantAcademique" ? "statutAcademique" : "statutProfessionnel";
  const blockchainRole = role === "EncadrantAcademique" ? "ACA" : "PRO";
  const table = role;

  const [[encadrant]] = await db.execute(`SELECT id, prenom, nom FROM ${table} WHERE email = ?`, [email]);
  const [[rapport]] = await db.execute("SELECT * FROM RapportStage WHERE id = ?", [rapportId]);
  const [[stage]] = await db.execute("SELECT * FROM Stage WHERE id = ?", [rapport.stageId]);
  const [[etudiant]] = await db.execute("SELECT prenom, nom FROM Etudiant WHERE id = ?", [rapport.etudiantId]);

  if ((champ === "statutAcademique" && rapport.statutAcademique) ||
      (champ === "statutProfessionnel" && rapport.statutProfessionnel)) {
    throw new Error("Ce rapport est déjà validé par cet encadrant.");
  }

  await db.execute(`UPDATE RapportStage SET ${champ} = TRUE WHERE id = ?`, [rapportId]);
  await validateAsEncadrant(rapport.identifiantRapport, blockchainRole);

  await notificationService.notifyUser({
    toId: rapport.etudiantId,
    toRole: "Etudiant",
    subject: "Rapport validé",
    templateName: champ === "statutAcademique" ? "rapport_validated_academique" : "rapport_validated_professionnel",
    templateData: {
      etudiantPrenom: etudiant.prenom,
      encadrantPrenom: encadrant.prenom,
      encadrantNom: encadrant.nom,
      lien: `${process.env.FRONTEND_URL || "http://localhost:3001"}/dashboard`
    },
    message: `Votre rapport a été validé par ${encadrant.prenom} ${encadrant.nom}.`
  });

  const [[updated]] = await db.execute("SELECT statutAcademique, statutProfessionnel FROM RapportStage WHERE id = ?", [rapportId]);
  if (updated.statutAcademique && updated.statutProfessionnel && !rapport.attestationGeneree) {
    await confirmDoubleValidation(rapport.identifiantRapport);
    await db.execute("UPDATE RapportStage SET attestationGeneree = FALSE WHERE id = ?", [rapportId]);

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
          identifiantStage: stage.identifiant_unique,
          identifiantRapport: rapport.identifiantRapport
        },
        message: `L'attestation de ${etudiant.prenom} ${etudiant.nom} est prête à être générée.`
      });
    }
  }
};



// Validation par un tier
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

  const [[updated]] = await db.execute("SELECT statutAcademique, statutProfessionnel FROM RapportStage WHERE id = ?", [rapportId]);
  if (updated.statutAcademique && updated.statutProfessionnel && !rapport.attestationGeneree) {
    await confirmDoubleValidation(rapport.identifiantRapport);
    await db.execute("UPDATE RapportStage SET attestationGeneree = FALSE WHERE id = ?", [rapportId]);

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
          identifiantStage: stage.identifiant_unique,
          identifiantRapport: rapport.identifiantRapport
        },
        message: `L'attestation de ${etudiant.prenom} ${etudiant.nom} est prête à être générée.`
      });
    }
  }
};


// Commentaire sur rapport avant validation
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

  await notificationService.notifyUser({
    toId: etudiant.id,
    toRole: "Etudiant",
    subject: "Commentaire reçu",
    templateName: "commentaire",
    templateData: {
      etudiantPrenom: etudiant.prenom,
      encadrantPrenom: encadrant.prenom,
      encadrantNom: encadrant.nom,
      commentaire
    },
    message: `Un encadrant a commenté votre rapport.`
  });
};
/// afficher sur les dashboards pour l'evaluer 
exports.getRapportsAValider = async (email, role) => {
  const table = role === "EncadrantAcademique" ? "EncadrantAcademique" : "EncadrantProfessionnel";
  const champ = role === "EncadrantAcademique" ? "statutAcademique" : "statutProfessionnel";

  const [[encadrant]] = await db.execute(`SELECT id FROM ${table} WHERE email = ?`, [email]);

  const [rows] = await db.execute(`
    SELECT r.id, r.fichier, r.identifiantRapport, r.dateSoumission,
           e.nom AS nomEtudiant, e.prenom AS prenomEtudiant
    FROM RapportStage r
    JOIN Stage s ON r.stageId = s.id
    JOIN Etudiant e ON r.etudiantId = e.id
    WHERE s.${role === "EncadrantAcademique" ? "encadrantAcademiqueId" : "encadrantProfessionnelId"} = ?
      AND r.${champ} = FALSE
  `, [encadrant.id]);

  return rows;
};
//ermet à un étudiant de voir l'historique de ses rapports 
exports.getMesRapports = async (email) => {
  const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email = ?", [email]);
  if (!etudiant) throw new Error("Étudiant introuvable.");

  const [rows] = await db.execute(`
    SELECT r.id, r.identifiantRapport, r.fichier, r.dateSoumission,
           r.statutAcademique, r.statutProfessionnel
    FROM RapportStage r
    WHERE r.etudiantId = ?
    ORDER BY r.dateSoumission DESC
  `, [etudiant.id]);

  return rows;
};


