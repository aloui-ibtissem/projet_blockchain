const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const sendEmail = require("../utils/sendEmail");

/**
 * Rendu HTML depuis un template
 */
const renderTemplate = (templateName, data) => {
  const templatePath = path.join(__dirname, "../templates/emails", `${templateName}.html`);
  if (!fs.existsSync(templatePath)) {
    console.error(" Fichier de template introuvable :", templatePath);
    throw new Error(`Template introuvable: ${templateName}`);
  }

  let html = fs.readFileSync(templatePath, "utf-8");
  for (const key in data) {
    html = html.replaceAll(`{{${key}}}`, data[key]);
  }
  return html;
};

/**
 * Envoi de notification + email
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
    // Map rôle -> nom de table de notifications (dashboard)
    const tableMap = {
      Etudiant: "etudiant",
      EncadrantAcademique: "encadrant_academique",
      EncadrantProfessionnel: "encadrant_professionnel",
      ResponsableUniversitaire: "universite",
      ResponsableEntreprise: "entreprise",
      TierDebloqueur: "encadrant_academique" // ou "universite" si besoin
    };

    const notificationType = tableMap[toRole];
    if (!notificationType) throw new Error(`Rôle non supporté : ${toRole}`);

    // Récupération email utilisateur
    const [[user]] = await db.execute(
      `SELECT prenom, nom, email FROM ${toRole} WHERE id = ?`,
      [toId]
    );
    if (!user || !user.email) throw new Error("Email introuvable pour l'utilisateur ciblé.");

    //  Notification dashboard (base de données)
    await db.execute(
      `INSERT INTO notifications (destinataire_id, destinataire_type, message)
       VALUES (?, ?, ?)`,
      [toId, notificationType, message || subject]
    );

    //  Envoi email si template HTML fourni
    if (templateName) {
      try {
        const fullTemplateData = {
          ...templateData,
          encadrantPrenom: user.prenom || "",
          encadrantNom: user.nom || ""
        };

        const html = renderTemplate(templateName, fullTemplateData);

        await sendEmail({
          to: user.email,
          subject,
          html
        });

        console.log(` Email envoyé à ${user.email} | Sujet : ${subject}`);
      } catch (emailErr) {
        console.error(` Échec du rendu ou envoi email à ${user.email}:`, emailErr.message);
      }
    }
  } catch (err) {
    console.error(" Erreur notificationService.notifyUser:", err.message);
  }
};
