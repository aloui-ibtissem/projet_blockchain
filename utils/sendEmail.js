//  utils/sendEmail.js
const nodemailer = require("nodemailer");
require("dotenv").config();

// Configuration du transporteur Gmail sécurisé
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envoie un email HTML à un ou plusieurs destinataires
 * @param {Object} param0 - to, subject, html
 */
module.exports = async function sendEmail({ to, subject, html }) {
  await transporter.sendMail({
    from: `"Plateforme Blockchain" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
