const express = require("express");
const router = express.Router();
const db = require("../config/db");
const checkToken = require("../middlewares/checkToken");
const multer = require("multer");

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

//récupérer nom  resp ent , logo , nom ent
router.get("/info", checkToken, async (req, res) => {
  try {
    const { id } = req.user;
    const [[row]] = await db.execute(`
      SELECT RE.nom AS responsableNom, RE.logoPath, E.nom AS entrepriseNom
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

//  Stocker les logos dans /logos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "logos"),
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    const uniqueName = `logo_${Date.now()}.${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

//  Route sécurisée pour uploader le logo
router.post("/upload-logo", checkToken, upload.single("logo"), async (req, res) => {
  try {
    const logoPath = req.file.path; 
    const responsableId = req.user.id;

    await db.execute(
      "UPDATE ResponsableEntreprise SET logoPath = ? WHERE id = ?",
      [logoPath, responsableId]
    );

    res.json({ success: true, logoPath });
  } catch (error) {
    console.error("Erreur upload logo :", error);
    res.status(500).json({ error: "Erreur serveur lors de l'enregistrement du logo." });
  }
});


module.exports = router;
