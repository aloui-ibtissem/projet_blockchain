const db = require("../config/db");
const sendEmail = require("../utils/sendEmail");

// 1. Proposer un stage
exports.proposeStage = async (req, res) => {
  try {
    const { sujet, objectifs, dateDebut, dateFin, encadrantAcademique, encadrantProfessionnel, entrepriseId } = req.body;
    const etudiantEmail = req.user.email;

    // Vérifie si étudiant, encadrants existent
    const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email=?", [etudiantEmail]);
    if (!etudiant) return res.status(404).json({ error: "Étudiant non trouvé." });

    const [[aca]] = await db.execute("SELECT id, email FROM EncadrantAcademique WHERE email=?", [encadrantAcademique]);
    if (!aca) return res.status(404).json({ error: "Encadrant académique non trouvé." });

    const [[pro]] = await db.execute("SELECT id, email FROM EncadrantProfessionnel WHERE email=?", [encadrantProfessionnel]);
    if (!pro) return res.status(404).json({ error: "Encadrant professionnel non trouvé." });

    // Enregistre le sujet
    await db.execute(
      `INSERT INTO SujetStage (titre, description, encadrantAcademiqueId, encadrantProfessionnelId, etudiantId, status)
       VALUES (?, ?, ?, ?, ?, 'en attente')`,
      [sujet, objectifs, aca.id, pro.id, etudiant.id]
    );

    // Notifications internes
    await db.execute(
      `INSERT INTO notifications (destinataire_id, destinataire_type, message)
       VALUES (?, 'encadrant_academique', ?), (?, 'encadrant_professionnel', ?)`,
      [aca.id, `Nouvelle proposition de stage : ${sujet}`, pro.id, `Nouvelle proposition de stage : ${sujet}`]
    );

    // Emails
    await sendEmail({
      to: etudiantEmail,
      subject: "Proposition envoyée",
      html: `<p>Votre proposition de stage <strong>${sujet}</strong> a été transmise aux encadrants.</p>`
    });

    await sendEmail({
      to: aca.email,
      subject: "Nouvelle proposition de stage",
      html: `<p>Un étudiant vous a proposé le sujet : <strong>${sujet}</strong>.</p>`
    });

    await sendEmail({
      to: pro.email,
      subject: "Sujet de stage à examiner",
      html: `<p>Veuillez examiner le sujet proposé : <strong>${sujet}</strong>.</p>`
    });

    res.json({ success: true });
  } catch (err) {
    console.error("proposeStage error:", err);
    res.status(500).json({ error: "Erreur lors de la proposition de stage." });
  }
};

// 2. Validation de sujet (par les deux encadrants)
exports.validateSujet = async (req, res) => {
  try {
    const { id } = req.body;
    const { email, role } = req.user;

    const table = role === "EncadrantAcademique" ? "EncadrantAcademique" : "EncadrantProfessionnel";
    const statusField = role === "EncadrantAcademique" ? "aca_validé" : "pro_validé";

    const [[encadrant]] = await db.execute(`SELECT id FROM ${table} WHERE email=?`, [email]);

    // Marque la validation
    await db.execute(`UPDATE SujetStage SET ${statusField}=TRUE WHERE id=?`, [id]);

    const [[sujet]] = await db.execute("SELECT * FROM SujetStage WHERE id=?", [id]);

    // Double validation → créer un stage
    if (sujet.aca_validé && sujet.pro_validé) {
      await db.execute(
        `INSERT INTO Stage (etudiantId, encadrantAcademiqueId, encadrantProfessionnelId, entrepriseId, dateDebut, dateFin, intervalleValidation)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          sujet.etudiantId,
          sujet.encadrantAcademiqueId,
          sujet.encadrantProfessionnelId,
          sujet.entrepriseId || 1,
          new Date(),
          new Date(),
          15
        ]
      );

      const [[{ id: stageId }]] = await db.execute("SELECT LAST_INSERT_ID() as id");
      await db.execute("UPDATE SujetStage SET status='validé', stageId=? WHERE id=?", [stageId, id]);

      // Notifier l'étudiant
      await db.execute(
        `INSERT INTO notifications (destinataire_id, destinataire_type, message)
         VALUES (?, 'etudiant', 'Votre sujet a été validé.')`,
        [sujet.etudiantId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("validateSujet error:", err);
    res.status(500).json({ error: "Erreur lors de la validation du sujet." });
  }
};

// 3. Soumettre le rapport
exports.submitReport = async (req, res) => {
  try {
    const email = req.user.email;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "Aucun fichier PDF envoyé." });

    const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email=?", [email]);
    const [[{ id: stageId }]] = await db.execute("SELECT id FROM Stage WHERE etudiantId=?", [etudiant.id]);

    const date = new Date().toISOString().slice(0, 10);

    await db.execute(
      "INSERT INTO RapportStage (stageId, etudiantId, dateSoumission) VALUES (?, ?, ?)",
      [stageId, etudiant.id, date]
    );

    const [[stage]] = await db.execute("SELECT encadrantAcademiqueId, encadrantProfessionnelId FROM Stage WHERE id=?", [stageId]);

    // Notifications
    await db.execute(
      `INSERT INTO notifications (destinataire_id, destinataire_type, message)
       VALUES (?, 'encadrant_academique', 'Rapport soumis'),
              (?, 'encadrant_professionnel', 'Rapport soumis')`,
      [stage.encadrantAcademiqueId, stage.encadrantProfessionnelId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("submitReport error:", err);
    res.status(500).json({ error: "Erreur lors de la soumission du rapport." });
  }
};

// 4. Validation du rapport
exports.validateReport = async (req, res) => {
  try {
    const { stageId } = req.body;
    const { role } = req.user;

    const column = role === "EncadrantAcademique" ? "statutAcademique" : "statutProfessionnel";

    await db.execute(`UPDATE RapportStage SET ${column}=TRUE WHERE stageId=?`, [stageId]);

    const [[rapport]] = await db.execute("SELECT statutAcademique, statutProfessionnel, etudiantId FROM RapportStage WHERE stageId=?", [stageId]);

    if (rapport.statutAcademique && rapport.statutProfessionnel) {
      await db.execute(
        `INSERT INTO notifications (destinataire_id, destinataire_type, message)
         VALUES (?, 'etudiant', 'Votre rapport a été validé.')`,
        [rapport.etudiantId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("validateReport error:", err);
    res.status(500).json({ error: "Erreur validation rapport." });
  }
};

// 5. Récupération des encadrements
exports.getEncadrementsAca = async (req, res) => {
  try {
    const [[encadrant]] = await db.execute("SELECT id FROM EncadrantAcademique WHERE email=?", [req.user.email]);
    const [rows] = await db.execute(
      `SELECT ss.id, ss.titre, e.nom as etudiant, ss.status
       FROM SujetStage ss
       JOIN Etudiant e ON ss.etudiantId = e.id
       WHERE ss.encadrantAcademiqueId=? AND ss.status IN ('validé', 'rapport_soumis')`,
      [encadrant.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur chargement encadrements." });
  }
};

exports.getEncadrementsPro = async (req, res) => {
  try {
    const [[encadrant]] = await db.execute("SELECT id FROM EncadrantProfessionnel WHERE email=?", [req.user.email]);
    const [rows] = await db.execute(
      `SELECT ss.id, ss.titre, e.nom as etudiant, ss.status
       FROM SujetStage ss
       JOIN Etudiant e ON ss.etudiantId = e.id
       WHERE ss.encadrantProfessionnelId=? AND ss.status IN ('validé', 'rapport_soumis')`,
      [encadrant.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erreur chargement encadrements." });
  }
};

// 6. Notifications pour chaque rôle
exports.getNotifications = async (req, res) => {
  try {
    const { email, role } = req.user;

    const table = {
      Etudiant: "Etudiant",
      EncadrantAcademique: "EncadrantAcademique",
      EncadrantProfessionnel: "EncadrantProfessionnel",
      ResponsableUniversitaire: "ResponsableUniversitaire",
      ResponsableEntreprise: "ResponsableEntreprise",
    }[role];

    const [[user]] = await db.execute(`SELECT id FROM ${table} WHERE email=?`, [email]);

    const [rows] = await db.execute(
      `SELECT * FROM notifications
       WHERE destinataire_id=? AND destinataire_type=? ORDER BY date_envoi DESC`,
      [user.id, role.toLowerCase()]
    );

    res.json(rows);
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ error: "Erreur chargement notifications." });
  }
};
