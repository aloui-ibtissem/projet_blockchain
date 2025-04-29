const db = require("../config/db");
const sendEmail = require("../utils/sendEmail");

// 1. Proposer un stage
exports.proposeStage = async (req, res) => {
  try {
    const { sujet, objectifs, dateDebut, dateFin, encadrantAcademique, encadrantProfessionnel } = req.body;
    const etudiantEmail = req.user.email;

    const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email=?", [etudiantEmail]);
    const [[aca]] = await db.execute("SELECT id, email FROM EncadrantAcademique WHERE email=?", [encadrantAcademique]);
    const [[pro]] = await db.execute("SELECT id, email FROM EncadrantProfessionnel WHERE email=?", [encadrantProfessionnel]);

    if (!etudiant || !aca || !pro) return res.status(400).json({ error: "Données utilisateur/encadrants non valides." });

    await db.execute(
      `INSERT INTO SujetStage (titre, description, dateDebut, dateFin, encadrantAcademiqueId, encadrantProfessionnelId, etudiantId, status, aca_validé, pro_validé)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'en attente', false, false)`,
      [sujet, objectifs, dateDebut, dateFin, aca.id, pro.id, etudiant.id]
    );

    await db.execute(
      `INSERT INTO notifications (destinataire_id, destinataire_type, message)
       VALUES (?, 'encadrant_academique', ?), (?, 'encadrant_professionnel', ?)`,
      [aca.id, `Nouvelle proposition de stage : ${sujet}`, pro.id, `Nouvelle proposition de stage : ${sujet}`]
    );

    await Promise.all([
      sendEmail({
        to: etudiantEmail,
        subject: "Proposition envoyée",
        html: `<p>Votre proposition de stage <strong>${sujet}</strong> a été transmise aux encadrants.</p>`
      }),
      sendEmail({
        to: aca.email,
        subject: "Nouvelle proposition de stage",
        html: `<p>Un étudiant vous a proposé le sujet : <strong>${sujet}</strong>.</p>`
      }),
      sendEmail({
        to: pro.email,
        subject: "Sujet de stage à examiner",
        html: `<p>Veuillez examiner le sujet proposé : <strong>${sujet}</strong>.</p>`
      })
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error("proposeStage error:", err);
    res.status(500).json({ error: "Erreur lors de la proposition de stage." });
  }
};

// 2. Valider ou rejeter un sujet
exports.validateSujet = async (req, res) => {
  try {
    const { sujetId, action, commentaire } = req.body;
    const { email, role } = req.user;

    const table = role === "EncadrantAcademique" ? "EncadrantAcademique" : "EncadrantProfessionnel";
    const statusField = role === "EncadrantAcademique" ? "aca_validé" : "pro_validé";
    const rejectionField = role === "EncadrantAcademique" ? "aca_refusé" : "pro_refusé";

    const [[encadrant]] = await db.execute(`SELECT id FROM ${table} WHERE email=?`, [email]);
    if (!encadrant) return res.status(404).json({ error: "Encadrant non trouvé." });

    if (action === "rejeter") {
      await db.execute(`UPDATE SujetStage SET ${rejectionField}=TRUE, status='refusé' WHERE id=?`, [sujetId]);
      const [[sujet]] = await db.execute("SELECT etudiantId FROM SujetStage WHERE id=?", [sujetId]);

      await db.execute(
        `INSERT INTO notifications (destinataire_id, destinataire_type, message)
         VALUES (?, 'etudiant', ?)`,
        [sujet.etudiantId, `Votre proposition a été refusée${commentaire ? ` : ${commentaire}` : ""}`]
      );
      return res.json({ success: true, message: "Sujet refusé." });
    }

    await db.execute(`UPDATE SujetStage SET ${statusField}=TRUE WHERE id=?`, [sujetId]);

    const [[sujet]] = await db.execute("SELECT * FROM SujetStage WHERE id=?", [sujetId]);

    if (sujet.aca_validé && sujet.pro_validé) {
      const [[pro]] = await db.execute(
        "SELECT entrepriseId FROM EncadrantProfessionnel WHERE id=?",
        [sujet.encadrantProfessionnelId]
      );

      if (!pro || !pro.entrepriseId) {
        return res.status(400).json({ error: "Encadrant pro sans entreprise liée." });
      }

      await db.execute(
        `INSERT INTO Stage (etudiantId, encadrantAcademiqueId, encadrantProfessionnelId, entrepriseId, dateDebut, dateFin, intervalleValidation)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          sujet.etudiantId,
          sujet.encadrantAcademiqueId,
          sujet.encadrantProfessionnelId,
          pro.entrepriseId,
          sujet.dateDebut,
          sujet.dateFin,
          15
        ]
      );

      const [[{ id: stageId }]] = await db.execute("SELECT LAST_INSERT_ID() as id");
      await db.execute("UPDATE SujetStage SET status='validé', stageId=? WHERE id=?", [stageId, sujetId]);

      await db.execute(
        `INSERT INTO notifications (destinataire_id, destinataire_type, message)
         VALUES (?, 'etudiant', 'Votre sujet a été validé. Le stage est maintenant actif.')`,
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
    const filePath = `/uploads/${file.filename}`; // suppose que le fichier est stocké dans public/uploads

    await db.execute(
      "INSERT INTO RapportStage (stageId, etudiantId, dateSoumission, fichier) VALUES (?, ?, ?, ?)",
      [stageId, etudiant.id, date, filePath]
    );

    const [[stage]] = await db.execute(`
      SELECT 
        aca.email AS acaEmail,
        pro.email AS proEmail
      FROM Stage
      JOIN EncadrantAcademique aca ON aca.id = Stage.encadrantAcademiqueId
      JOIN EncadrantProfessionnel pro ON pro.id = Stage.encadrantProfessionnelId
      WHERE Stage.id = ?
    `, [stageId]);

    await sendEmail({
      to: [stage.acaEmail, stage.proEmail],
      subject: "Nouveau rapport de stage soumis",
      html: `<p>L’étudiant a soumis son rapport de stage.</p>
             <p><a href="http://localhost:3000${filePath}" target="_blank">📄 Voir le rapport</a></p>`
    });

    await db.execute(`
      INSERT INTO notifications (destinataire_id, destinataire_type, message)
      VALUES (?, 'encadrant_academique', 'Rapport soumis'),
             (?, 'encadrant_professionnel', 'Rapport soumis')
    `, [stage.encadrantAcademiqueId, stage.encadrantProfessionnelId]);

    res.json({ success: true });
  } catch (err) {
    console.error("submitReport error:", err);
    res.status(500).json({ error: "Erreur lors de la soumission du rapport." });
  }
};
// récupérer rapport + commenter 
exports.getRapportsEncadrant = async (req, res) => {
  try {
    const { email, role } = req.user;
    const table = role === "EncadrantAcademique" ? "encadrantAcademiqueId" : "encadrantProfessionnelId";
    const type = role === "EncadrantAcademique" ? "aca" : "pro";

    const [[encadrant]] = await db.execute(`SELECT id FROM ${role} WHERE email=?`, [email]);

    const [rows] = await db.execute(`
      SELECT 
        r.id AS rapportId,
        r.dateSoumission,
        r.fichier,
        e.nom AS etudiantNom,
        e.prenom AS etudiantPrenom
      FROM RapportStage r
      JOIN Etudiant e ON e.id = r.etudiantId
      JOIN Stage s ON s.id = r.stageId
      WHERE s.${table} = ?
    `, [encadrant.id]);

    res.json(rows);
  } catch (err) {
    console.error("getRapportsEncadrant error:", err);
    res.status(500).json({ error: "Erreur récupération des rapports." });
  }
};
 //
 exports.commenterRapport = async (req, res) => {
  try {
    const { rapportId, commentaire } = req.body;
    const { email, role } = req.user;

    const [[rapport]] = await db.execute(`
      SELECT r.etudiantId, e.email
      FROM RapportStage r
      JOIN Etudiant e ON r.etudiantId = e.id
      WHERE r.id = ?
    `, [rapportId]);

    if (!rapport) return res.status(404).json({ error: "Rapport non trouvé." });

    await db.execute(`
      INSERT INTO notifications (destinataire_id, destinataire_type, message)
      VALUES (?, 'etudiant', ?)`,
      [rapport.etudiantId, `Un encadrant a commenté votre rapport : "${commentaire}"`]
    );

    await sendEmail({
      to: rapport.email,
      subject: "Commentaire sur votre rapport de stage",
      html: `<p>Un encadrant a commenté votre rapport :</p><blockquote>${commentaire}</blockquote>`
    });

    res.json({ success: true });
  } catch (err) {
    console.error("commenterRapport error:", err);
    res.status(500).json({ error: "Erreur envoi commentaire." });
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

//ajout des propositions dans les dashboards des encadrants

// Propositions pour encadrant académique
exports.getPropositionsAca = async (req, res) => {
  try {
    const [[encadrant]] = await db.execute("SELECT id FROM EncadrantAcademique WHERE email=?", [req.user.email]);
    const [rows] = await db.execute(`
      SELECT ss.id, ss.titre, ss.description, e.nom, e.prenom
      FROM SujetStage ss
      JOIN Etudiant e ON e.id = ss.etudiantId
      WHERE ss.encadrantAcademiqueId = ? AND ss.status = 'en attente'
    `, [encadrant.id]);

    // Retourne nom + prénom
    const propositions = rows.map(r => ({
      ...r,
      etudiantNomComplet: `${r.prenom} ${r.nom}`
    }));

    res.json(propositions);
  } catch (err) {
    console.error("getPropositionsAca error:", err);
    res.status(500).json({ error: "Erreur chargement des propositions académiques." });
  }
};


// Propositions pour encadrant professionnel
exports.getPropositionsPro = async (req, res) => {
  try {
    const [[encadrant]] = await db.execute("SELECT id FROM EncadrantProfessionnel WHERE email=?", [req.user.email]);

    const [rows] = await db.execute(`
      SELECT ss.id, ss.titre, ss.description, e.prenom, e.nom
      FROM SujetStage ss
      JOIN Etudiant e ON e.id = ss.etudiantId
      WHERE ss.encadrantProfessionnelId = ? AND ss.status = 'en attente'
    `, [encadrant.id]);

    const propositions = rows.map(r => ({
      ...r,
      etudiantNomComplet: `${r.prenom} ${r.nom}`
    }));

    res.json(propositions);
  } catch (err) {
    console.error("getPropositionsPro error:", err);
    res.status(500).json({ error: "Erreur chargement des propositions professionnelles." });
  }
};

// Get current stage for logged-in student
exports.getCurrentStage = async (req, res) => {
  try {
    const email = req.user.email;
    const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email=?", [email]);
    if (!etudiant) return res.status(404).json({ error: "Étudiant non trouvé." });

    const [[stage]] = await db.execute(`
      SELECT 
        s.dateDebut, s.dateFin, e.nom AS entreprise,
        aca.nom AS acaNom, aca.prenom AS acaPrenom, aca.email AS acaEmail,
        pro.nom AS proNom, pro.prenom AS proPrenom, pro.email AS proEmail
      FROM Stage s
      JOIN Entreprise e ON e.id = s.entrepriseId
      JOIN EncadrantAcademique aca ON aca.id = s.encadrantAcademiqueId
      JOIN EncadrantProfessionnel pro ON pro.id = s.encadrantProfessionnelId
      WHERE s.etudiantId = ?
    `, [etudiant.id]);

    if (!stage) return res.status(404).json({ error: "Aucun stage trouvé." });

    res.json(stage);
  } catch (err) {
    console.error("getCurrentStage error:", err);
    res.status(500).json({ error: "Erreur récupération du stage." });
  }
};

//récupère stage pour etudiant dans son dash 
exports.getCurrentStage = async (req, res) => {
  try {
    const email = req.user.email;
    const [[etudiant]] = await db.execute("SELECT id FROM Etudiant WHERE email=?", [email]);
    if (!etudiant) return res.status(404).json({ error: "Étudiant non trouvé." });

    const [[stage]] = await db.execute(`
      SELECT 
        s.dateDebut, s.dateFin, e.nom AS entreprise,
        aca.nom AS acaNom, aca.prenom AS acaPrenom, aca.email AS acaEmail,
        pro.nom AS proNom, pro.prenom AS proPrenom, pro.email AS proEmail
      FROM Stage s
      JOIN Entreprise e ON e.id = s.entrepriseId
      JOIN EncadrantAcademique aca ON aca.id = s.encadrantAcademiqueId
      JOIN EncadrantProfessionnel pro ON pro.id = s.encadrantProfessionnelId
      WHERE s.etudiantId = ?
    `, [etudiant.id]);

    if (!stage) return res.status(404).json({ error: "Aucun stage trouvé." });

    res.json(stage);
  } catch (err) {
    console.error("getCurrentStage error:", err);
    res.status(500).json({ error: "Erreur récupération du stage." });
  }
};



