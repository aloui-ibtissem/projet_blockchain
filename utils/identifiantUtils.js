const db = require("../config/db");

/**
 * Normalise une chaîne pour l'utiliser dans un identifiant
 * Supprime accents, convertit en majuscule, remplace caractères non alphanumériques par '_'
 */
function slugify(str) {
  return str
    .toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // supprime accents
    .replace(/[^\w]+/g, "_")                           // remplace non alphanum par '_'
    .replace(/^_+|_+$/g, "");                          // supprime '_' en début/fin
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
    `SELECT nom FROM ${tableName} WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) {
    throw new Error(`ID introuvable dans la table ${tableName} (id=${id})`);
  }
  return slugify(rows[0].nom);
}

/**
 * Génère un identifiant unique structuré pour un stage
 * Format : [Année]_[NOM_ENTREPRISE]_[NOM_UNIVERSITE]_[XXX]
 */
async function genererIdentifiantStage(entrepriseId, universiteId) {
  const annee = genererAnneeUniversitaire();
  const codeEnt = await getCodeEntite("Entreprise", entrepriseId);
  const codeUni = await getCodeEntite("Universite", universiteId);

  const [[row]] = await db.execute(
    `SELECT dernierNumero FROM CompteurStage
     WHERE annee = ? AND entrepriseId = ? AND universiteId = ?`,
    [annee, entrepriseId, universiteId]
  );
  let num = row ? row.dernierNumero + 1 : 1;
  if (row) {
    await db.execute(
      `UPDATE CompteurStage SET dernierNumero = ? WHERE annee = ? AND entrepriseId = ? AND universiteId = ?`,
      [num, annee, entrepriseId, universiteId]
    );
  } else {
    await db.execute(
      `INSERT INTO CompteurStage (annee, entrepriseId, universiteId, dernierNumero)
       VALUES (?, ?, ?, ?)`,
      [annee, entrepriseId, universiteId, num]
    );
  }
  return `${annee}_${codeEnt}_${codeUni}_${String(num).padStart(3, "0")}`;
}

/**
 * Génère un identifiant structuré pour un acteur
 * Format : ROLE_[NOM_ENTITE]_[XXX]
 * @param {{role:string, structureType:string, structureId:number}} opts
 */
async function genererIdentifiantActeur({ role, structureType, structureId }) {
  if (!structureId) {
    throw new Error(`structureId manquant pour ${structureType}`);
  }
  const table = structureType.toLowerCase() === "entreprise" ? "Entreprise" : "Universite";
  const codeEntite = await getCodeEntite(table, structureId);

  const colonne = "identifiant_unique";
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS total FROM ${role}
     WHERE ${colonne} LIKE ?`,
    [`${role.toUpperCase()}_${codeEntite}_%`]
  );
  const next = rows[0].total + 1;
  return `${role.toUpperCase()}_${codeEntite}_${String(next).padStart(3, "0")}`;
}

module.exports = {
  genererAnneeUniversitaire,
  genererIdentifiantStage,
  genererIdentifiantActeur
};
