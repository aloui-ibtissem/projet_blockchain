const db = require("../config/db");

exports.getRapportsEnRetardUni = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT RapportStage.id AS rapportId, Etudiant.prenom AS etudiantPrenom, Etudiant.nom AS etudiantNom, Stage.dateDebut, Stage.dateFin, RapportStage.dateSoumission
      FROM RapportStage
      JOIN Stage ON RapportStage.stageId = Stage.id
      JOIN Etudiant ON RapportStage.etudiantId = Etudiant.id
      WHERE RapportStage.statutAcademique = FALSE AND CURRENT_DATE > DATE_ADD(RapportStage.dateSoumission, INTERVAL 7 DAY)
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

exports.validerRapportUni = async (req, res) => {
  try {
    const { rapportId } = req.body;
    await db.execute(`UPDATE RapportStage SET statutAcademique = TRUE WHERE id = ?`, [rapportId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

exports.getRapportsEnRetardEnt = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT RapportStage.id AS rapportId, Etudiant.prenom AS etudiantPrenom, Etudiant.nom AS etudiantNom, Stage.dateDebut, Stage.dateFin, RapportStage.dateSoumission
      FROM RapportStage
      JOIN Stage ON RapportStage.stageId = Stage.id
      JOIN Etudiant ON RapportStage.etudiantId = Etudiant.id
      WHERE RapportStage.statutProfessionnel = FALSE AND CURRENT_DATE > DATE_ADD(RapportStage.dateSoumission, INTERVAL 7 DAY)
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

exports.validerRapportEnt = async (req, res) => {
  try {
    const { rapportId } = req.body;
    await db.execute(`UPDATE RapportStage SET statutProfessionnel = TRUE WHERE id = ?`, [rapportId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};
