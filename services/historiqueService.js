const db = require("../config/db");

/**
 * Journalise une action dans la table HistoriqueAction.
 * @param {Object} options
 * @param {number|null} options.rapportId - ID du rapport concerné (peut être null).
 * @param {number} options.utilisateurId - ID de l'utilisateur ayant effectué l'action.
 * @param {string} options.role - Rôle de l'utilisateur (Etudiant, EncadrantAcademique, etc.).
 * @param {string} options.action - Nom ou description de l'action.
 * @param {string|null} options.commentaire - Détails complémentaires (optionnel).
 * @param {string} options.origine - "manuelle" ou "automatique".
 */
exports.logAction = async ({
  rapportId = null,
  utilisateurId,
  role,
  action,
  commentaire = null,
  origine = "manuelle",
}) => {
  try {
    await db.execute(
      `INSERT INTO HistoriqueAction 
        (rapportId, utilisateurId, role, action, commentaire, origine, dateAction) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [rapportId, utilisateurId, role, action, commentaire, origine]
    );
  } catch (err) {
    console.error("Erreur lors de la journalisation (historiqueService) :", err);
    // Ne pas bloquer l'action principale même en cas d'erreur ici
  }
};

/**
 * Récupère les actions historiques pour un utilisateur
 * @param {number} utilisateurId - ID de l'utilisateur
 * @param {string} role - rôle de l'utilisateur
 * @param {string|null} filtreOrigine - 'automatique' ou 'manuelle' ou null pour tout
 */
exports.getHistoriqueParUtilisateur = async (utilisateurId, role, filtreOrigine = null) => {
  let query = `
    SELECT id, rapportId, action, commentaire, origine, dateAction
    FROM HistoriqueAction
    WHERE utilisateurId = ? AND role = ?
  `;
  const params = [utilisateurId, role];

  if (filtreOrigine) {
    query += ` AND origine = ?`;
    params.push(filtreOrigine);
  }

  query += ` ORDER BY dateAction DESC`;

  const [rows] = await db.execute(query, params);
  return rows;
};

/**
 * Recherche par mot-clé ou identifiant dans l'historique.
 * @param {string} motCle - mot clé à rechercher dans action/commentaire
 * @param {string} [origine] - optionnel: filtre sur l’origine
 */
exports.rechercherHistorique = async (motCle, origine = null) => {
  let query = `
    SELECT * FROM HistoriqueAction
    WHERE (action LIKE ? OR commentaire LIKE ?)
  `;
  const params = [`%${motCle}%`, `%${motCle}%`];

  if (origine) {
    query += ` AND origine = ?`;
    params.push(origine);
  }

  query += ` ORDER BY dateAction DESC`;

  const [rows] = await db.execute(query, params);
  return rows;
};

/**
 * Récupère les actions liées à un rapport spécifique
 * @param {number} rapportId 
 */
exports.getHistoriqueParRapport = async (rapportId) => {
  const [rows] = await db.execute(
    `SELECT * FROM HistoriqueAction WHERE rapportId = ? ORDER BY dateAction DESC`,
    [rapportId]
  );
  return rows;
};
