const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const sendEmail = require("../utils/sendEmail");

/**
 * Charge et remplace dynamiquement les variables dans un template HTML
 */
const renderTemplate = (templateName, data) => {
  const templatePath = path.join(__dirname, "../templates/emails", `${templateName}.html`);
  if (!fs.existsSync(templatePath)) throw new Error(`Template introuvable : ${templateName}`);

  let html = fs.readFileSync(templatePath, "utf-8");
  for (const key in data) {
    html = html.replaceAll(`{{${key}}}`, data[key] || "");
  }
  return html;
};

/**
 * Envoie une notification en base de données + email HTML
 * @param {object} options
 * @param {number} options.toId - ID du destinataire
 * @param {string} options.toRole - Rôle exact (Etudiant, EncadrantAcademique, etc.)
 * @param {string} options.subject - Sujet de l'email
 * @param {string} options.templateName - Nom du fichier HTML (sans .html)
 * @param {object} options.templateData - Données à injecter dans le template
 * @param {string} [options.message] - Message visible dans le dashboard
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

    // Récupérer le destinataire (nom, prénom, email)
    const [[dest]] = await db.execute(`SELECT prenom, nom, email FROM ${toRole} WHERE id = ?`, [toId]);
    if (!dest || !dest.email) throw new Error("Email destinataire introuvable");

    // Enregistrement de la notification en base
    await db.execute(`
      INSERT INTO notifications (destinataire_id, destinataire_type, message)
      VALUES (?, ?, ?)`,
      [toId, table, message || subject]
    );

    // Envoi email si un template est fourni
    if (templateName) {
      const html = renderTemplate(templateName, {
        ...templateData,
        destinatairePrenom: dest.prenom,
        destinataireNom: dest.nom
      });

      await sendEmail({
        to: dest.email,
        subject,
        html
      });

      console.log(` Email envoyé à ${dest.email} (${toRole})`);
    }
  } catch (err) {
    console.error(" Erreur dans notifyUser:", err.message);
  }
};
