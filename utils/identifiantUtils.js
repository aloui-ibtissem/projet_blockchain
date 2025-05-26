const db = require("../config/db");

function slugify(str) {
  return str
    .toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function genererAnneeUniversitaire() {
  const today = new Date();
  const year = today.getFullYear();
  const next = year + 1;
  const prev = year - 1;
  return today.getMonth() + 1 >= 9 ? `${year}-${next}` : `${prev}-${year}`;
}

async function getCodeEntite(tableName, id) {
  const [rows] = await db.execute(`SELECT nom FROM ${tableName} WHERE id = ?`, [id]);
  if (!rows || rows.length === 0) throw new Error(`ID introuvable dans ${tableName}`);
  return slugify(rows[0].nom);
}

// STAGE
async function genererIdentifiantStage(entrepriseId, universiteId) {
  const annee = genererAnneeUniversitaire();
  const codeEnt = await getCodeEntite("Entreprise", entrepriseId);
  const codeUni = await getCodeEntite("Universite", universiteId);

  const [[row]] = await db.execute(`
    SELECT dernierNumero FROM CompteurStage
    WHERE annee = ? AND entrepriseId = ? AND universiteId = ?
  `, [annee, entrepriseId, universiteId]);

  const num = row ? row.dernierNumero + 1 : 1;

  if (row) {
    await db.execute(`
      UPDATE CompteurStage SET dernierNumero = ?
      WHERE annee = ? AND entrepriseId = ? AND universiteId = ?
    `, [num, annee, entrepriseId, universiteId]);
  } else {
    await db.execute(`
      INSERT INTO CompteurStage (annee, entrepriseId, universiteId, dernierNumero)
      VALUES (?, ?, ?, ?)
    `, [annee, entrepriseId, universiteId, num]);
  }

  return `${annee}_${codeEnt}_${codeUni}_${String(num).padStart(3, "0")}`;
}

// ACTEUR
async function genererIdentifiantActeur({ role, structureType, structureId }) {
  const table = structureType.toLowerCase() === "entreprise" ? "Entreprise" : "Universite";
  const codeEntite = await getCodeEntite(table, structureId);

  const validRoles = {
    ResponsableUniversitaire: "ResponsableUniversitaire",
    ResponsableEntreprise: "ResponsableEntreprise",
    EncadrantAcademique: "EncadrantAcademique",
    EncadrantProfessionnel: "EncadrantProfessionnel",
    Etudiant: "Etudiant",
    TierDebloqueur: "TierDebloqueur"
  };

  const tableName = validRoles[role];
  if (!tableName) throw new Error("Rôle invalide dans identifiantActeur");

  const [rows] = await db.execute(`
    SELECT COUNT(*) AS total FROM ${tableName}
    WHERE identifiant_unique LIKE ?
  `, [`${role.toUpperCase()}_${codeEntite}_%`]);

  const next = rows[0].total + 1;
  return `${role.toUpperCase()}_${codeEntite}_${String(next).padStart(3, "0")}`;
}

// RAPPORT
async function genererIdentifiantRapport(etudiantId) {
  const annee = genererAnneeUniversitaire();

  const [[etudiant]] = await db.execute(`
    SELECT u.nom AS universite FROM Etudiant e
    JOIN Universite u ON e.universiteId = u.id
    WHERE e.id = ?
  `, [etudiantId]);

  if (!etudiant) throw new Error("Étudiant introuvable pour identifiantRapport");

  const codeUni = slugify(etudiant.universite);
  const timestamp = Date.now();

  const [rows] = await db.execute(`
    SELECT COUNT(*) AS total FROM RapportStage WHERE etudiantId = ?
  `, [etudiantId]);

  const num = rows[0].total + 1;
  return `RPT_${codeUni}_${annee}_${String(num).padStart(3, "0")}_${timestamp}`;
}

// ATTESTATION
async function genererIdentifiantAttestation(universiteId, entrepriseId) {
  const annee = new Date().getFullYear();
  const idConcat = `${universiteId}${entrepriseId}`;

  const [[{ total }]] = await db.execute(`
    SELECT COUNT(*) AS total FROM Attestation WHERE identifiant LIKE ?
  `, [`ATT_${annee}_${idConcat}_%`]);

  const compteur = String(total + 1).padStart(2, "0");
  return `ATT_${annee}_${idConcat}_${compteur}`;
}

module.exports = {
  genererAnneeUniversitaire,
  genererIdentifiantStage,
  genererIdentifiantActeur,
  genererIdentifiantRapport,
  genererIdentifiantAttestation
};
