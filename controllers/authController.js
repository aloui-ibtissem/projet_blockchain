const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user');
const blockchainService = require('../utils/blockchain.service');
const emailService = require('../utils/email.service');
const { generatePassword } = require('../utils/password.generator');
const dotenv = require('dotenv');

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

/**
 * Inscription d'un nouvel utilisateur
 */
exports.inscription = async (req, res) => {
  try {
    const { nom, prenom, email, role } = req.body;

    // Vérifier que tous les champs requis sont présents
    if (!nom || !prenom || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont obligatoires',
      });
    }

    // Vérifier que le rôle est valide (1-5)
    const roleId = parseInt(role);
    if (isNaN(roleId) || roleId < 1 || roleId > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide',
      });
    }

    // Vérifier si l'utilisateur existe déjà dans la base de données
    const utilisateurExistant = await UserModel.getUserByEmail(email);

    if (!utilisateurExistant) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé dans la base de données. Veuillez contacter l\'administrateur.',
      });
    }

    // Vérifier si l'utilisateur a déjà un mot de passe (déjà inscrit)
    if (utilisateurExistant.mot_de_passe) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur est déjà inscrit. Veuillez vous connecter.',
      });
    }

    // Vérifier que le nom et prénom correspondent
    if (utilisateurExistant.nom !== nom || utilisateurExistant.prenom !== prenom) {
      return res.status(400).json({
        success: false,
        message: 'Les informations fournies ne correspondent pas à nos enregistrements.',
      });
    }

    // Vérifier que le rôle correspond
    if (utilisateurExistant.role_id !== roleId) {
      return res.status(400).json({
        success: false,
        message: 'Le rôle sélectionné ne correspond pas à nos enregistrements.',
      });
    }

    // Générer un mot de passe aléatoire
    const motDePasse = generatePassword();

    // Hacher le mot de passe pour la base de données
    const motDePasseHash = await bcrypt.hash(motDePasse, 10);

    // Mettre à jour le mot de passe dans la base de données
    await UserModel.updatePassword(utilisateurExistant.id, motDePasseHash);

    // Enregistrer l'utilisateur dans la blockchain
    const blockchainResult = await blockchainService.registerUser(
      nom,
      prenom,
      email,
      motDePasse,
      roleId
    );

    // Mettre à jour l'adresse blockchain dans la base de données
    await UserModel.updateBlockchainAddress(utilisateurExistant.id, blockchainResult.transactionHash);

    // Enregistrer le log d'authentification
    await UserModel.logAuthAction(
      utilisateurExistant.id,
      'inscription',
      req.ip,
      req.headers['user-agent'],
      blockchainResult.transactionHash
    );

    // Envoi du mot de passe par email en utilisant SendGrid
    const emailParams = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: 'Votre mot de passe',
      text: `Bonjour ${prenom} ${nom},\n\nVoici votre mot de passe: ${motDePasse}\n\nMerci de vous inscrire.`,
    };

    await emailService.sendEmail(emailParams);

    // Envoyer la confirmation d'inscription
    await emailService.envoyerConfirmationInscription(email, nom, prenom, roleId);

    // Répondre avec succès
    res.status(200).json({
      success: true,
      message: 'Inscription réussie. Un mot de passe a été envoyé à votre adresse email.',
      blockchainTx: blockchainResult.transactionHash,
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de l\'inscription',
      error: error.message,
    });
  }
};

/**
 * Connexion d'un utilisateur
 */
exports.connexion = async (req, res) => {
  try {
    const { email, motDePasse, role } = req.body;

    // Vérifier que tous les champs requis sont présents
    if (!email || !motDePasse || !role) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont obligatoires',
      });
    }

    // Vérifier que le rôle est valide (1-5)
    const roleId = parseInt(role);
    if (isNaN(roleId) || roleId < 1 || roleId > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide',
      });
    }

    // Récupérer l'utilisateur depuis la base de données
    const utilisateur = await UserModel.getUserByEmail(email);

    // Vérifier que l'utilisateur existe
    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Vérifier que le rôle correspond
    if (utilisateur.role_id !== roleId) {
      return res.status(400).json({
        success: false,
        message: 'Le rôle sélectionné ne correspond pas à cet utilisateur',
      });
    }

    // Vérifier que l'utilisateur a un mot de passe (est inscrit)
    if (!utilisateur.mot_de_passe) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur n\'est pas encore inscrit. Veuillez vous inscrire d\'abord.',
      });
    }

    // Vérifier le mot de passe
    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.mot_de_passe);
    if (!motDePasseValide) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect',
      });
    }

    // Authentifier via la blockchain
    try {
      const blockchainResult = await blockchainService.authenticateUser(
        email,
        motDePasse,
        roleId
      );

      // Enregistrer le log d'authentification
      await UserModel.logAuthAction(
        utilisateur.id,
        'connexion',
        req.ip,
        req.headers['user-agent'],
        blockchainResult.transactionHash
      );
    } catch (blockchainError) {
      console.error('Erreur lors de l\'authentification blockchain:', blockchainError);
      // Continuer même en cas d'erreur blockchain pour ne pas bloquer l'utilisateur
    }

    // Générer un token JWT
    const token = jwt.sign(
      {
        id: utilisateur.id,
        email: utilisateur.email,
        role: roleId,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Répondre avec succès
    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      token,
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: roleId,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de la connexion',
      error: error.message,
    });
  }
};