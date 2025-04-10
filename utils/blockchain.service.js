// blockchain.service.js
/**
 * Service pour interagir avec le contrat intelligent d'authentification
 * Gère la connexion avec la blockchain et les appels au contrat
 */

const { ethers } = require('ethers');
const AuthenticationContractABI = require('../abis/abi.json');
const config = require('../config/db');

// Chargement explicite des variables d'environnement depuis la racine
require('dotenv').config({ path: '../.env' });

// Vérification de la clé privée et du RPC URL avant d'initialiser le fournisseur et le portefeuille
if (!process.env.BLOCKCHAIN_RPC_URL || !process.env.BLOCKCHAIN_PRIVATE_KEY) {
  throw new Error("La configuration du RPC URL ou de la clé privée est manquante dans le fichier de configuration.");
}

// Configuration du fournisseur Ethereum
const provider = new ethers.providers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);

// Portefeuille pour signer les transactions
const wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);

// Instance du contrat
const authContract = new ethers.Contract(
  process.env.AUTH_CONTRACT_ADDRESS,
  AuthenticationContractABI.abi,
  wallet
);

/**
 * Enregistre un nouvel utilisateur sur la blockchain
 * @param {string} email - Email de l'utilisateur
 * @param {string} nom - Nom de l'utilisateur
 * @param {string} prenom - Prénom de l'utilisateur
 * @param {string} role - Rôle de l'utilisateur
 * @param {string} passwordHash - Hash du mot de passe
 * @returns {Promise<boolean>} - Succès de l'opération
 */
const registerUserOnBlockchain = async (email, nom, prenom, role, passwordHash) => {
  try {
    console.log(`Enregistrement de l'utilisateur ${email} sur la blockchain...`);
    
    // Vérification des paramètres
    if (!email || !nom || !prenom || !role || !passwordHash) {
      throw new Error("Tous les paramètres doivent être fournis.");
    }

    // Convertir le hash du mot de passe en bytes32
    const passwordHashBytes = ethers.utils.id(passwordHash);
    
    // Appeler la fonction du contrat
    const tx = await authContract.registerUser(
      email,
      nom,
      prenom,
      role,
      passwordHashBytes
    );
    
    // Attendre la confirmation de la transaction
    const receipt = await tx.wait();
    
    // Vérifier si la transaction a réussi
    const event = receipt.events.find(event => event.event === 'UserRegistered');
    if (!event) {
      console.error('Événement UserRegistered non trouvé dans la transaction');
      return false;
    }
    
    console.log(`Utilisateur ${email} enregistré avec succès sur la blockchain`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement sur la blockchain:', error);
    return false;
  }
};

/**
 * Authentifie un utilisateur via la blockchain
 * @param {string} email - Email de l'utilisateur
 * @param {string} passwordHash - Hash du mot de passe
 * @returns {Promise<Object>} - Résultat de l'authentification
 */
const authenticateUserOnBlockchain = async (email, passwordHash) => {
  try {
    console.log(`Authentification de l'utilisateur ${email} via la blockchain...`);
    
    // Vérification des paramètres
    if (!email || !passwordHash) {
      throw new Error("L'email et le hash du mot de passe doivent être fournis.");
    }

    // Convertir le hash du mot de passe en bytes32
    const passwordHashBytes = ethers.utils.id(passwordHash);
    
    // Appeler la fonction du contrat
    const result = await authContract.authenticateUser(
      email,
      passwordHashBytes
    );
    
    // Extraire les résultats
    const [authenticated, role, authSignature] = result;
    
    if (!authenticated) {
      console.log(`Authentification échouée pour ${email}`);
      return { success: false };
    }
    
    console.log(`Utilisateur ${email} authentifié avec succès, rôle: ${role}`);
    return {
      success: true,
      role,
      authSignature: authSignature.toString()
    };
  } catch (error) {
    console.error('Erreur lors de l\'authentification via la blockchain:', error);
    return { success: false };
  }
};

/**
 * Vérifie le rôle d'un utilisateur via la blockchain
 * @param {string} email - Email de l'utilisateur
 * @param {string} role - Rôle à vérifier
 * @returns {Promise<boolean>} - Résultat de la vérification
 */
const verifyUserRoleOnBlockchain = async (email, role) => {
  try {
    console.log(`Vérification du rôle ${role} pour l'utilisateur ${email}...`);
    
    // Vérification des paramètres
    if (!email || !role) {
      throw new Error("L'email et le rôle doivent être fournis.");
    }

    // Appeler la fonction du contrat
    const isValid = await authContract.verifyUserRole(email, role);
    
    console.log(`Rôle ${role} pour ${email}: ${isValid ? 'valide' : 'invalide'}`);
    return isValid;
  } catch (error) {
    console.error('Erreur lors de la vérification du rôle:', error);
    return false;
  }
};

/**
 * Vérifie l'authenticité d'une signature d'authentification
 * @param {string} email - Email de l'utilisateur
 * @param {string} role - Rôle de l'utilisateur
 * @param {string} authSignature - Signature d'authentification
 * @returns {Promise<boolean>} - Résultat de la vérification
 */
const verifyUserAuthentication = async (email, role, authSignature) => {
  try {
    console.log(`Vérification de l'authentification pour ${email}...`);
    
    // Vérification des paramètres
    if (!email || !role || !authSignature) {
      throw new Error("L'email, le rôle et la signature d'authentification doivent être fournis.");
    }
    
    // Si la signature est vide, considérer comme invalide
    if (!authSignature) {
      console.log('Signature d\'authentification manquante');
      return false;
    }
    
    // Convertir la signature en bytes32 si nécessaire
    const authSignatureBytes = authSignature.startsWith('0x') 
      ? authSignature 
      : ethers.utils.hexlify(ethers.utils.toUtf8Bytes(authSignature));
    
    // Appeler la fonction du contrat
    const isValid = await authContract.verifyAuthSignature(
      email,
      role,
      authSignatureBytes
    );
    
    console.log(`Authentification pour ${email}: ${isValid ? 'valide' : 'invalide'}`);
    return isValid;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    return false;
  }
};

/**
 * Met à jour le mot de passe d'un utilisateur sur la blockchain
 * @param {string} email - Email de l'utilisateur
 * @param {string} oldPasswordHash - Hash de l'ancien mot de passe
 * @param {string} newPasswordHash - Hash du nouveau mot de passe
 * @returns {Promise<boolean>} - Succès de l'opération
 */
const updatePasswordOnBlockchain = async (email, oldPasswordHash, newPasswordHash) => {
  try {
    console.log(`Mise à jour du mot de passe pour ${email}...`);
    
    // Vérification des paramètres
    if (!email || !oldPasswordHash || !newPasswordHash) {
      throw new Error("L'email, l'ancien hash du mot de passe et le nouveau hash doivent être fournis.");
    }

    // Convertir les hash en bytes32
    const oldPasswordHashBytes = ethers.utils.id(oldPasswordHash);
    const newPasswordHashBytes = ethers.utils.id(newPasswordHash);
    
    // Appeler la fonction du contrat
    const tx = await authContract.updatePassword(
      email,
      oldPasswordHashBytes,
      newPasswordHashBytes
    );
    
    // Attendre la confirmation de la transaction
    const receipt = await tx.wait();
    
    // Vérifier si la transaction a réussi
    const event = receipt.events.find(event => event.event === 'UserUpdated');
    if (!event) {
      console.error('Événement UserUpdated non trouvé dans la transaction');
      return false;
    }
    
    console.log(`Mot de passe mis à jour avec succès pour ${email}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mot de passe:', error);
    return false;
  }
};

/**
 * Récupère les informations d'un utilisateur depuis la blockchain
 * @param {string} email - Email de l'utilisateur
 * @returns {Promise<Object>} - Informations de l'utilisateur
 */
const getUserInfoFromBlockchain = async (email) => {
  try {
    console.log(`Récupération des informations pour ${email}...`);
    
    // Vérification des paramètres
    if (!email) {
      throw new Error("L'email doit être fourni.");
    }

    // Appeler la fonction du contrat
    const result = await authContract.getUserInfo(email);
    
    // Extraire les résultats
    const [exists, nom, prenom, role, isActive] = result;
    
    if (!exists) {
      console.log(`Utilisateur ${email} non trouvé sur la blockchain`);
      return { exists: false };
    }
    
    console.log(`Informations récupérées pour ${email}`);
    return {
      exists,
      nom,
      prenom,
      role,
      isActive
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des informations:', error);
    return { exists: false };
  }
};

// Exportation des fonctions
module.exports = {
  registerUserOnBlockchain,
  authenticateUserOnBlockchain,
  verifyUserRoleOnBlockchain,
  verifyUserAuthentication,
  updatePasswordOnBlockchain,
  getUserInfoFromBlockchain
};
