const express = require("express");
const router = express.Router();
const db = require("../config/db");
const checkToken = require("../middlewares/checkToken");

//  Route publique : liste des entreprises
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT id, nom FROM Entreprise");
    res.json(rows);
  } catch (err) {
    console.error("Erreur récupération entreprises :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

//  Route privée : dashboard du ResponsableEntreprise
router.get("/dashboard", checkToken, async (req, res) => {
  try {
    const { id } = req.user;

    // Étape 1 : récupérer les stagiaires avec rapport validé (2x) mais sans attestation
    const [stagiaires] = await db.execute(`
      SELECT DISTINCT S.id AS stageId, E.prenom, E.nom, E.email
      FROM Stage S
      JOIN Etudiant E ON S.etudiantId = E.id
      JOIN RapportStage R ON R.stageId = S.id
      WHERE R.statutAcademique = TRUE
        AND R.statutProfessionnel = TRUE
        AND R.attestationGeneree = FALSE
        AND S.entrepriseId = (
          SELECT entrepriseId FROM ResponsableEntreprise WHERE id = ?
        )
    `, [id]);

    // Étape 2 : récupérer les notifications du responsable
    const [notifications] = await db.execute(`
  SELECT id, message, date_envoi
  FROM notifications
  WHERE destinataire_id = ? AND destinataire_type = 'entreprise'
  ORDER BY date_envoi DESC
`, [id]);

    res.status(200).json({ stagiaires, notifications });
  } catch (err) {
    console.error("Erreur /entreprise/dashboard :", err);
    res.status(500).json({ error: "Erreur serveur lors du chargement du tableau de bord." });
  }
});

module.exports = router;
