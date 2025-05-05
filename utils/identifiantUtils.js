
const db = require("../config/db");

/**
 * Génère l'année universitaire en cours, ex : 2024-2025
 */
function genererAnneeUniversitaire() {
  const today = new Date();
  const year = today.getFullYear();
  const next = year + 1;
  const prev = year - 1;
  return today.getMonth() + 1 >= 9 ? `${year}-${next}` : `${prev}-${year}`;
}

/**
 * Récupère l'acronyme d'une entreprise ou d'une université selon son ID
 */
async function getAcronymeById(table, id) {
  const [rows] = await db.execute(`SELECT nom FROM ${table} WHERE id = ?`, [id]);
  if (rows.length === 0) throw new Error(`ID introuvable dans la table ${table}`);
  return rows[0].nom.toUpperCase(); // Les noms doivent être déjà codés en acronyme (ex : ENIG, GCT)
}

/**
 * Génère un identifiant unique structuré pour un stage
 * Format : [Année]_ENTREPRISE_UNIVERSITE_001
 */
async function genererIdentifiantStage(entrepriseId, universiteId) {
  const annee = genererAnneeUniversitaire();
  const entrepriseCode = await getAcronymeById("Entreprise", entrepriseId);
  const universiteCode = await getAcronymeById("Universite", universiteId);

  const [[row]] = await db.execute(`
    SELECT dernierNumero FROM CompteurStage WHERE annee = ? AND entrepriseId = ? AND universiteId = ?
  `, [annee, entrepriseId, universiteId]);

  let numero = 1;
  if (row) {
    numero = row.dernierNumero + 1;
    await db.execute(`
      UPDATE CompteurStage SET dernierNumero = ? 
      WHERE annee = ? AND entrepriseId = ? AND universiteId = ?
    `, [numero, annee, entrepriseId, universiteId]);
  } else {
    await db.execute(`
      INSERT INTO CompteurStage (annee, entrepriseId, universiteId, dernierNumero)
      VALUES (?, ?, ?, ?)
    `, [annee, entrepriseId, universiteId, numero]);
  }

  return `${annee}_${entrepriseCode}_${universiteCode}_${String(numero).padStart(3, "0")}`;
}

/**
 * Génère un identifiant structuré pour un acteur (étudiant, encadrant, tier...)
 * Format : ROLE_ENTITE_001
 */
async function genererIdentifiantActeur({ role, structureType, structureId }) {
  const acronyme = await getAcronymeById(structureType === "entreprise" ? "Entreprise" : "Universite", structureId);
  const table = `${role}`; // Exemple : Etudiant, EncadrantAcademique, etc.
  const column = "identifiant_unique";

  const [rows] = await db.execute(`
    SELECT COUNT(*) AS total FROM ${table}
    WHERE ${column} LIKE ?
  `, [`${role.toUpperCase()}_${acronyme}_%`]);

  const next = rows[0].total + 1;
  return `${role.toUpperCase()}_${acronyme}_${String(next).padStart(3, "0")}`;
}

module.exports = {
  genererIdentifiantStage,
  genererIdentifiantActeur,
  genererAnneeUniversitaire
};
