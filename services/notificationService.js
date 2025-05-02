const fs = require("fs");
const path = require("path");
const sendEmail = require("../utils/sendEmail");


 //Injecte les variables dynamiques dans  template HTML
 
const renderTemplate = (templateName, data) => {
  let file = path.join(__dirname, "../templates/emails", `${templateName}.html`);
  let html = fs.readFileSync(file, "utf-8");
  for (const key in data) {
    html = html.replaceAll(`{{${key}}}`, data[key]);
  }
  return html;
};


 //Envoie un email et insère une notification en BDD
 
exports.notifyUser = async ({ db, toId, toRole, subject, templateName, templateData, message }) => {
  try {
    // Récupérer email utilisateur
    const [[user]] = await db.execute(
      `SELECT email FROM ${toRole} WHERE id=?`,
      [toId]
    );
    if (!user || !user.email) throw new Error("Email introuvable");

    // Générer HTML email
    const html = renderTemplate(templateName, templateData);

    // Envoi d’email
    await sendEmail({
      to: user.email,
      subject,
      html
    });

    // Notification interne (Dashboard)
    await db.execute(
      `INSERT INTO notifications (destinataire_id, destinataire_type, message) VALUES (?, ?, ?)`,
      [toId, toRole.toLowerCase(), message || subject]
    );
  } catch (err) {
    console.error("Erreur notification:", err);
  }
};
