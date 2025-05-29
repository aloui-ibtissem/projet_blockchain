// Express router for entreprise
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const checkToken = require("../middlewares/checkToken");
const multer = require("multer");

// Public route: list entreprises
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT id, nom FROM Entreprise");
    res.json(rows);
  } catch (err) {
    console.error("Erreur récupération entreprises :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// Dashboard route for ResponsableEntreprise
router.get("/dashboard", checkToken, async (req, res) => {
  try {
    const { id } = req.user;
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

// Get entreprise info for ResponsableEntreprise
router.get("/info", checkToken, async (req, res) => {
  try {
    const { id } = req.user;
    const [[row]] = await db.execute(`
      SELECT CONCAT(RE.prenom, ' ', RE.nom) AS responsableNom, E.logoPath, E.nom AS entrepriseNom
      FROM ResponsableEntreprise RE
      JOIN Entreprise E ON RE.entrepriseId = E.id
      WHERE RE.id = ?
    `, [id]);

    if (!row) return res.status(404).json({ error: "Responsable non trouvé." });
    res.json(row);
  } catch (err) {
    console.error("Erreur /entreprises/info :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// Setup for storing logo files
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "logos"),
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    const uniqueName = `logo_${Date.now()}.${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Upload logo and update in Entreprise table
router.post("/upload-logo", checkToken, upload.single("logo"), async (req, res) => {
  try {
    const logoPath = req.file.path;
    const responsableId = req.user.id;

    await db.execute(`
      UPDATE Entreprise
      SET logoPath = ?
      WHERE id = (SELECT entrepriseId FROM ResponsableEntreprise WHERE id = ?)
    `, [logoPath, responsableId]);

    res.json({ success: true, logoPath });
  } catch (error) {
    console.error("Erreur upload logo :", error);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement du logo." });
  }
});

module.exports = router;
