const db = require("../config/db");

/**
 * Normalise une chaîne pour l'utiliser dans un identifiant
 */
function slugify(str) {
  return str
    .toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

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
 * Récupère le nom normalisé d'une entité selon son ID
 */
async function getCodeEntite(tableName, id) {
  const [rows] = await db.execute(
    `SELECT nom FROM ${tableName} WHERE id = ?`, [id]
  );
  if (rows.length === 0) throw new Error(`ID introuvable dans ${tableName}`);
  return slugify(rows[0].nom);
}

/**
 * Génère un identifiant unique structuré pour un stage
 * Format : [Année]_[ENTREPRISE]_[UNIVERSITE]_[XXX]
 */
async function genererIdentifiantStage(entrepriseId, universiteId) {
  const annee = genererAnneeUniversitaire();
  const codeEnt = await getCodeEntite("Entreprise", entrepriseId);
  const codeUni = await getCodeEntite("Universite", universiteId);

  const [[row]] = await db.execute(`
    SELECT dernierNumero FROM CompteurStage
    WHERE annee = ? AND entrepriseId = ? AND universiteId = ?
  `, [annee, entrepriseId, universiteId]);

  let num = row ? row.dernierNumero + 1 : 1;
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

/**
 * Génère un identifiant structuré pour un acteur
 * Format : ROLE_ENTITE_XXX
 */
async function genererIdentifiantActeur({ role, structureType, structureId }) {
  const table = structureType.toLowerCase() === "entreprise" ? "Entreprise" : "Universite";
  const codeEntite = await getCodeEntite(table, structureId);

  const [rows] = await db.execute(`
    SELECT COUNT(*) AS total FROM ${role}
    WHERE identifiant_unique LIKE ?
  `, [`${role.toUpperCase()}_${codeEntite}_%`]);

  const next = rows[0].total + 1;
  return `${role.toUpperCase()}_${codeEntite}_${String(next).padStart(3, "0")}`;
}

/**
 * Génère un identifiant structuré pour un rapport
 * Format : RPT_UNI_2024-2025_001_TIMESTAMP
 */
async function genererIdentifiantRapport(etudiantId) {
  const annee = genererAnneeUniversitaire();

  const [[etudiant]] = await db.execute(`
    SELECT u.nom as universite FROM Etudiant e
    JOIN Universite u ON e.universiteId = u.id
    WHERE e.id = ?
  `, [etudiantId]);

  const codeUni = slugify(etudiant.universite);
  const timestamp = Date.now();

  const [rows] = await db.execute(`
    SELECT COUNT(*) as total FROM RapportStage WHERE etudiantId = ?
  `, [etudiantId]);

  const num = rows[0].total + 1;
  return `RPT_${codeUni}_${annee}_${String(num).padStart(3, "0")}_${timestamp}`;
}

module.exports = {
  genererAnneeUniversitaire,
  genererIdentifiantStage,
  genererIdentifiantActeur,
  genererIdentifiantRapport
};
