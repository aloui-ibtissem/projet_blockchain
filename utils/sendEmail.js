const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Envoie un email HTML + fallback texte
 */
module.exports = async function sendEmail({ to, subject, html, text }) {
  const fallback = text || "Merci de consulter ce message dans un client compatible HTML.";

  const mailOptions = {
    from: `"StageChain" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    replyTo: process.env.EMAIL_USER,
    html,
    text: fallback,
    headers: {
      "X-Mailer": "StageChainApp",
      "Precedence": "bulk", // pour ne pas être considéré comme spam massif
      "X-Priority": "3"
    }
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(` Email envoyé à ${to}`);
  } catch (err) {
    console.error("Erreur d'envoi:", err.message);
  }
};
