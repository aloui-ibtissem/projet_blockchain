const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const sendEmail = require("../utils/sendEmail");

// Variables globales injectées dans tous les templates
const globalTemplateVars = {
  year: new Date().getFullYear(),
  appName: "StageChain – Plateforme Blockchain",
  appUrl: process.env.PUBLIC_URL || "http://localhost:3000",
};

// Ajouter aussi des URLs utiles pour les templates
globalTemplateVars.homeUrl = globalTemplateVars.appUrl + "/";
globalTemplateVars.loginUrl = globalTemplateVars.appUrl + "/login";

const renderTemplate = (templateName, data) => {
  const templatePath = path.join(__dirname, "../templates/emails", `${templateName}.html`);
  if (!fs.existsSync(templatePath)) throw new Error(`Template introuvable : ${templateName}`);
  
  let html = fs.readFileSync(templatePath, "utf-8");

  const finalData = {
    ...globalTemplateVars,
    ...data
  };

  for (const key in finalData) {
    html = html.replaceAll(`{{${key}}}`, finalData[key] || "");
  }

  return html;
};

/**
 * Envoie une notification dashboard + email stylé
 * @param {object} options
 * @param {number} options.toId
 * @param {string} options.toRole
 * @param {string} options.subject
 * @param {string} options.templateName
 * @param {object} options.templateData
 * @param {string} [options.message]
 */
exports.notifyUser = async ({
  toId,
  toRole,
  subject,
  templateName,
  templateData = {},
  message = null
}) => {
  try {
    const tableMap = {
      Etudiant: "etudiant",
      EncadrantAcademique: "encadrant_academique",
      EncadrantProfessionnel: "encadrant_professionnel",
      ResponsableUniversitaire: "universite",
      ResponsableEntreprise: "entreprise",
      TierDebloqueur: "tier_debloqueur"
    };

    const table = tableMap[toRole];
    if (!table) throw new Error(`Rôle non supporté : ${toRole}`);

    const [[dest]] = await db.execute(`SELECT prenom, nom, email FROM ${toRole} WHERE id = ?`, [toId]);
    if (!dest || !dest.email) throw new Error("Email destinataire introuvable");

    await db.execute(`
      INSERT INTO notifications (destinataire_id, destinataire_type, message)
      VALUES (?, ?, ?)`,
      [toId, table, message || subject]
    );

    if (templateName) {
      const html = renderTemplate(templateName, {
        ...templateData,
        destinatairePrenom: dest.prenom,
        destinataireNom: dest.nom
      });

      await sendEmail({
        to: dest.email,
        subject,
        html,
        text: `Bonjour ${dest.prenom},

Vous avez reçu une notification de ${globalTemplateVars.appName} :

"${subject}"

Accédez à votre espace personnel : ${globalTemplateVars.loginUrl}

— ${globalTemplateVars.appName}`
      });

      console.log(`Email envoyé à ${dest.email} (${toRole})`);
    }
  } catch (err) {
    console.error("Erreur dans notifyUser:", err.message);
  }
};

//
exports.getNotifications = async (userId, role) => {
  const [rows] = await db.execute(
    `SELECT id, subject, message, createdAt FROM notifications
     WHERE userId = ? AND userRole = ? 
     ORDER BY createdAt DESC LIMIT 10`,
    [userId, role]
  );
  return rows;
};

