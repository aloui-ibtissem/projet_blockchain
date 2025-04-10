const jwt = require('jsonwebtoken');
const User = require('../models/user');
const blockchainService = require('../utils/blockchain.service');
const dotenv = require('dotenv');

// Charger les variables d'environnement depuis le fichier .env
require('dotenv').config({ path: '../.env' });

/**
 * Middleware pour vérifier le token JWT
 */
const verifyToken = async (req, res, next) => {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé: Token manquant',
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Vérifier l'authenticité via la blockchain
    const isVerifiedOnBlockchain = await blockchainService.verifyUserAuthentication(
      user.email,
      user.role,
      decoded.authSignature
    );

    if (!isVerifiedOnBlockchain) {
      return res.status(401).json({
        success: false,
        message: 'Vérification blockchain échouée',
      });
    }

    // Ajouter les informations de l'utilisateur à la requête
    req.user = { // Change req.utilisateur to req.user
      id: user._id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide',
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré',
      });
    }

    console.error('Erreur d\'authentification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur lors de l\'authentification',
    });
  }
};

/**
 * Middleware pour vérifier les rôles autorisés
 * @param {Array} roles - Tableau des rôles autorisés
 * @returns {Function} Middleware Express
 */
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès interdit: Vous n\'avez pas les permissions nécessaires',
      });
    }

    next();
  };
};

/**
 * Middleware pour vérifier les permissions spécifiques
 * @param {Array} requiredPermissions - Tableau des permissions requises
 * @returns {Function} Middleware Express
 */
const hasPermission = (requiredPermissions = []) => {
  if (typeof requiredPermissions === 'string') {
    requiredPermissions = [requiredPermissions];
  }

  return (req, res, next) => {
    const userRole = req.user.role;
    const userPermissions = PERMISSIONS[userRole] || [];

    const hasAllRequiredPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAllRequiredPermissions) {
      return res.status(403).json({
        success: false,
        message: 'Accès interdit: Vous n\'avez pas les permissions nécessaires pour cette action',
      });
    }

    next();
  };
};

/**
 * Constantes pour les rôles d'utilisateurs
 */
const ROLES = {
  ETUDIANT: 'etudiant',
  ENCADRANT_ACADEMIQUE: 'encadrantAcademique',
  ENCADRANT_PROFESSIONNEL: 'encadrantProfessionnel',
  RESPONSABLE_UNIVERSITAIRE: 'responsableUniversitaire',
  RESPONSABLE_ENTREPRISE: 'responsableEntreprise',
};

/**
 * Permissions spécifiques par rôle
 */
const PERMISSIONS = {
  [ROLES.ETUDIANT]: [
    'view_own_profile',
    'edit_own_profile',
    'submit_report',
    'view_own_reports',
    'view_own_evaluations',
    'contact_supervisors',
  ],
  [ROLES.ENCADRANT_ACADEMIQUE]: [
    'view_own_profile',
    'edit_own_profile',
    'view_assigned_students',
    'evaluate_reports',
    'create_meetings',
    'contact_students',
    'contact_professional_supervisors',
  ],
  [ROLES.ENCADRANT_PROFESSIONNEL]: [
    'view_own_profile',
    'edit_own_profile',
    'view_assigned_interns',
    'evaluate_interns',
    'create_meetings',
    'contact_interns',
    'contact_academic_supervisors',
  ],
  [ROLES.RESPONSABLE_UNIVERSITAIRE]: [
    'view_own_profile',
    'edit_own_profile',
    'manage_students',
    'manage_academic_supervisors',
    'view_all_reports',
    'view_all_evaluations',
    'manage_university_settings',
    'contact_all_users',
  ],
  [ROLES.RESPONSABLE_ENTREPRISE]: [
    'view_own_profile',
    'edit_own_profile',
    'manage_interns',
    'manage_professional_supervisors',
    'create_internship_offers',
    'manage_company_settings',
    'contact_all_company_users',
  ],
};

module.exports = {
  verifyToken,
  authorize,
  hasPermission,
  ROLES,
  PERMISSIONS,
};
