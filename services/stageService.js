const db = require("../config/db");

// Fonction pour générer l'année universitaire
function genererAnneeUniversitaire() {
  const today = new Date();
  const annee = today.getMonth() + 1 >= 9
    ? `${today.getFullYear()}-${today.getFullYear() + 1}`
    : `${today.getFullYear() - 1}-${today.getFullYear()}`;
  return annee;
}

// Générer identifiant structuré de stage
async function genererIdentifiantStage({ entrepriseId, universiteId }) {
  const annee = genererAnneeUniversitaire();

  // Cherche ou initialise compteur
  const [[row]] = await db.execute(
    `SELECT dernierNumero FROM CompteurStage WHERE annee = ? AND entrepriseId = ? AND universiteId = ?`,
    [annee, entrepriseId, universiteId]
  );

  let numero = 1;
  if (row) {
    numero = row.dernierNumero + 1;
    await db.execute(
      `UPDATE CompteurStage SET dernierNumero = ? WHERE annee = ? AND entrepriseId = ? AND universiteId = ?`,
      [numero, annee, entrepriseId, universiteId]
    );
  } else {
    await db.execute(
      `INSERT INTO CompteurStage (annee, entrepriseId, universiteId, dernierNumero) VALUES (?, ?, ?, ?)`,
      [annee, entrepriseId, universiteId, numero]
    );
  }

  return `${annee}_E${entrepriseId}U${universiteId}_${String(numero).padStart(3, "0")}`;
}

// Création de la proposition de sujet
exports.proposerSujet = async ({ sujet, objectifs, dateDebut, dateFin, encadrantAcademique, encadrantProfessionnel, etudiantEmail }) => {
  const [[etudiant]] = await db.execute("SELECT id, universiteId FROM Etudiant WHERE email=?", [etudiantEmail]);
  const [[aca]] = await db.execute("SELECT id FROM EncadrantAcademique WHERE email=?", [encadrantAcademique]);
  const [[pro]] = await db.execute("SELECT id FROM EncadrantProfessionnel WHERE email=?", [encadrantProfessionnel]);

  if (!etudiant || !aca || !pro) throw new Error("Données invalides");

  await exports.createStageProposal({
    sujet,
    objectifs,
    dateDebut,
    dateFin,
    etudiantId: etudiant.id,
    acaId: aca.id,
    proId: pro.id
  });
};

exports.createStageProposal = async ({ sujet, objectifs, dateDebut, dateFin, etudiantId, acaId, proId }) => {
  await db.execute(`
    INSERT INTO SujetStage (
      titre, description, dateDebut, dateFin, encadrantAcademiqueId, encadrantProfessionnelId, etudiantId, status, aca_validé, pro_validé
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'en attente', false, false)
  `, [sujet, objectifs, dateDebut, dateFin, acaId, proId, etudiantId]);
};

// Validation ou rejet d’un sujet
exports.validerOuRejeterSujet = async ({ sujetId, action, commentaire, email, role }) => {
  const column = role === "EncadrantAcademique" ? "aca_validé" : "pro_validé";

  if (action === "accepter") {
    await exports.validateSujetPart({ sujetId, column });
  } else {
    await exports.rejectSujet({ sujetId, column });
    return;
  }

  const [[sujet]] = await db.execute("SELECT * FROM SujetStage WHERE id=?", [sujetId]);
  if (sujet.aca_validé && sujet.pro_validé) {
    await exports.activateStageIfValidated(sujet);
  }

  // Enregistrer commentaire
  await db.execute(`
    INSERT INTO CommentaireSujet (sujetId, commentaire, auteurEmail, date)
    VALUES (?, ?, ?, NOW())
  `, [sujetId, commentaire || "", email]);
};

exports.validateSujetPart = async ({ sujetId, column }) => {
  await db.execute(`UPDATE SujetStage SET ${column}=TRUE WHERE id=?`, [sujetId]);
};

exports.rejectSujet = async ({ sujetId, column }) => {
  await db.execute(`UPDATE SujetStage SET ${column}=TRUE, status='refusé' WHERE id=?`, [sujetId]);
};

// Création du stage une fois les deux validations faites
exports.activateStageIfValidated = async (sujet) => {
  const [[pro]] = await db.execute("SELECT entrepriseId FROM EncadrantProfessionnel WHERE id=?", [sujet.encadrantProfessionnelId]);
  const [[etudiant]] = await db.execute("SELECT universiteId FROM Etudiant WHERE id=?", [sujet.etudiantId]);

  if (!pro?.entrepriseId || !etudiant?.universiteId) throw new Error("Entreprise ou université non trouvée");

  const identifiant = await genererIdentifiantStage({
    entrepriseId: pro.entrepriseId,
    universiteId: etudiant.universiteId
  });

  await db.execute(`
    INSERT INTO Stage (
      etudiantId, encadrantAcademiqueId, encadrantProfessionnelId, entrepriseId, titre, dateDebut, dateFin, intervalleValidation, identifiant_unique
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    sujet.etudiantId,
    sujet.encadrantAcademiqueId,
    sujet.encadrantProfessionnelId,
    pro.entrepriseId,
    sujet.titre,
    sujet.dateDebut,
    sujet.dateFin,
    15,
    identifiant
  ]);

  const [[{ id: stageId }]] = await db.execute("SELECT LAST_INSERT_ID() AS id");
  await db.execute("UPDATE SujetStage SET status='validé', stageId=? WHERE id=?", [stageId, sujet.id]);

  return { stageId, identifiant };
};
