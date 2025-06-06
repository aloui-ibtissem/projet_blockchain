const db = require("../config/db");

/**
 * Journalise une action dans la table HistoriqueAction avec possibilité d'inclure un lien de rapport.
 * @param {Object} options
 * @param {number|null} options.rapportId - ID du rapport concerné (peut être null).
 * @param {number} options.utilisateurId - ID de l'utilisateur ayant effectué l'action.
 * @param {string} options.role - Rôle de l'utilisateur.
 * @param {string} options.action - Description de l'action.
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
    let finalCommentaire = commentaire;

    // Ajoute un lien vers le fichier du rapport si disponible
    if (rapportId) {
      const [[rapport]] = await db.execute(
        `SELECT fichier FROM RapportStage WHERE id = ? ORDER BY dateSoumission DESC LIMIT 1`,
        [rapportId]
      );
      if (rapport?.fichier) {
        const lien = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/uploads/${rapport.fichier}`;
        finalCommentaire = finalCommentaire
          ? `${finalCommentaire} | Voir rapport: ${lien}`
          : `Voir rapport: ${lien}`;
      }
    }

    await db.execute(
      `INSERT INTO HistoriqueAction 
        (rapportId, utilisateurId, role, action, commentaire, origine, dateAction) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [rapportId, utilisateurId, role, action, finalCommentaire, origine]
    );
  } catch (err) {
    console.error("Erreur lors de la journalisation (historiqueService):", err.message);
  }
};

/**
 * Récupère l’historique des actions d’un utilisateur
 * @param {number} utilisateurId 
 * @param {string} role 
 * @param {string|null} filtreOrigine - 'automatique' | 'manuelle' | null (toutes)
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

  try {
    const [rows] = await db.execute(query, params);
    return rows;
  } catch (err) {
    console.error("[HistoriqueService] Erreur récupération utilisateur :", err.message);
    return [];
  }
};

/**
 * Recherche dans l'historique par mot-clé (action/commentaire)
 * @param {string} motCle 
 * @param {string|null} origine 
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

  try {
    const [rows] = await db.execute(query, params);
    return rows;
  } catch (err) {
    console.error("[HistoriqueService] Erreur recherche historique :", err.message);
    return [];
  }
};

/**
 * Récupère les actions liées à un rapport
 * @param {number} rapportId 
 */
exports.getHistoriqueParRapport = async (rapportId) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM HistoriqueAction WHERE rapportId = ? ORDER BY dateAction DESC`,
      [rapportId]
    );
    return rows;
  } catch (err) {
    console.error("[HistoriqueService] Erreur historique par rapport :", err.message);
    return [];
  }
};
