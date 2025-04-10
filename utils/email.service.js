const sgMail = require('@sendgrid/mail');
require('dotenv').config();

class EmailService {
  constructor() {
    // Configurer SendGrid avec la clé API
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async envoyerMotDePasse(destinataire, nom, prenom, motDePasse, role) {
    try {
      let roleTexte = '';
      switch (role) {
        case 1:
          roleTexte = 'Étudiant';
          break;
        case 2:
          roleTexte = 'Encadrant Académique';
          break;
        case 3:
          roleTexte = 'Encadrant Professionnel';
          break;
        case 4:
          roleTexte = 'Responsable Universitaire';
          break;
        case 5:
          roleTexte = 'Responsable Entreprise';
          break;
        default:
          roleTexte = 'Utilisateur';
      }

      // Options de l'email
      const msg = {
        to: destinataire,
        from: process.env.EMAIL_FROM, // Par exemple "noreply@localhost.test"
        subject: 'Votre mot de passe pour accéder à la plateforme',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333;">Bienvenue sur notre plateforme</h2>
            <p>Bonjour ${prenom} ${nom},</p>
            <p>Votre compte a été créé avec succès en tant que <strong>${roleTexte}</strong>.</p>
            <p>Voici votre mot de passe généré automatiquement :</p>
            <div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center;">
              <code style="font-size: 18px; font-weight: bold;">${motDePasse}</code>
            </div>
            <p>Nous vous recommandons de changer ce mot de passe dès votre première connexion.</p>
            <p>Pour vous connecter, veuillez utiliser votre adresse email et ce mot de passe.</p>
            <p style="margin-top: 20px;">Cordialement,</p>
            <p>L'équipe de la plateforme</p>
          </div>
        `,
      };

      // Envoyer l'email via SendGrid
      const info = await sgMail.send(msg);
      console.log(`Email envoyé à ${destinataire}: ${info[0].statusCode}`);
      return {
        success: true,
        messageId: info[0].headers['x-message-id']
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      throw error;
    }
  }

  async envoyerConfirmationInscription(destinataire, nom, prenom, role) {
    try {
      let roleTexte = '';
      switch (role) {
        case 1:
          roleTexte = 'Étudiant';
          break;
        case 2:
          roleTexte = 'Encadrant Académique';
          break;
        case 3:
          roleTexte = 'Encadrant Professionnel';
          break;
        case 4:
          roleTexte = 'Responsable Universitaire';
          break;
        case 5:
          roleTexte = 'Responsable Entreprise';
          break;
        default:
          roleTexte = 'Utilisateur';
      }

      const msg = {
        to: destinataire,
        from: process.env.EMAIL_FROM,
        subject: 'Confirmation d\'inscription',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333;">Inscription confirmée</h2>
            <p>Bonjour ${prenom} ${nom},</p>
            <p>Nous vous confirmons que votre inscription en tant que <strong>${roleTexte}</strong> a été enregistrée avec succès.</p>
            <p>Votre compte est maintenant actif et sécurisé par notre technologie blockchain.</p>
            <p>Vous pouvez vous connecter à tout moment en utilisant votre adresse email et le mot de passe qui vous a été envoyé précédemment.</p>
            <p style="margin-top: 20px;">Cordialement,</p>
            <p>L'équipe de la plateforme</p>
          </div>
        `,
      };

      // Envoyer l'email de confirmation via SendGrid
      const info = await sgMail.send(msg);
      console.log(`Email de confirmation envoyé à ${destinataire}: ${info[0].statusCode}`);
      return {
        success: true,
        messageId: info[0].headers['x-message-id']
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
      throw error;
    }
  }
}

// Exporter une instance singleton du service
module.exports = new EmailService();
