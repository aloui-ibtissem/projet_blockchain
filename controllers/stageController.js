const db = require("../config/db");
const sendEmail = require("../utils/sendEmail");

exports.proposeStage = async (req, res) => {
  try {
    const { sujet, objectifs, dateDebut, dateFin, encadrantAcademique, encadrantProfessionnel, entrepriseId } = req.body;
    const etudiantEmail = req.user.email;

    const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email=?", [etudiantEmail]);
    const [[aca]] = await db.execute("SELECT id FROM EncadrantAcademique WHERE ethAddress=?", [encadrantAcademique]);
    const [[pro]] = await db.execute("SELECT id FROM EncadrantProfessionnel WHERE ethAddress=?", [encadrantProfessionnel]);

    await db.execute(
      `INSERT INTO SujetStage (titre, description, encadrantAcademiqueId, encadrantProfessionnelId, etudiantId)
       VALUES (?, ?, ?, ?, ?)`,
      [sujet, objectifs, aca.id, pro.id, etudiant.id]
    );

    // Simulation email
    await sendEmail({
      to: req.user.email,
      subject: "Proposition de stage envoyée",
      html: `<p>Votre sujet de stage a bien été proposé.</p>`
    });

    res.json({ success: true });
  } catch (err) {
    console.error("proposeStage error:", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};

exports.getPropositionsAca = async (req, res) => {
  try {
    const [[encadrant]] = await db.execute("SELECT id FROM EncadrantAcademique WHERE email=?", [req.user.email]);

    const [propositions] = await db.execute(
      `SELECT ss.id, ss.titre, e.email as etudiantEmail
       FROM SujetStage ss
       JOIN Etudiant e ON ss.etudiantId = e.id
       WHERE ss.encadrantAcademiqueId=? AND ss.status='en attente'`,
      [encadrant.id]
    );

    res.json(propositions);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.validateSujet = async (req, res) => {
  try {
    const { sujetId } = req.body;
    await db.execute("UPDATE SujetStage SET status='validé' WHERE id=?", [sujetId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur validation sujet" });
  }
};

exports.submitReport = async (req, res) => {
  try {
    const etudiantEmail = req.user.email;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "Aucun fichier envoyé." });

    const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email=?", [etudiantEmail]);
    const date = new Date().toISOString().slice(0, 10);

    const [[{ id: stageId }]] = await db.execute("SELECT id FROM Stage WHERE etudiantId=?", [etudiant.id]);

    await db.execute(
      "INSERT INTO RapportStage (stageId, etudiantId, dateSoumission) VALUES (?, ?, ?)",
      [stageId, etudiant.id, date]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la soumission." });
  }
};

exports.validateReport = async (req, res) => {
  try {
    const { stageId } = req.body;
    const user = req.user;

    const type = user.role === "EncadrantAcademique" ? "statutAcademique" : "statutProfessionnel";

    await db.execute(`UPDATE RapportStage SET ${type}=TRUE WHERE stageId=?`, [stageId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur validation rapport" });
  }
};
