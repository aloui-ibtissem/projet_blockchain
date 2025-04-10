/**
 * Service d'authentification
 * Gère les appels API pour l'inscription, la connexion et la vérification du token
 */

import axios from 'axios';
import Web3 from 'web3';
import AuthABI from './abis/abi.json';

// URL de base de l'API
const API_URL = process.env.REACT_APP_API_URL ;

// Configuration blockchain
const web3 = new Web3(Web3.givenProvider || 'http://localhost:8545'  );
const contractAddress = process.env.REACT_APP_AUTH_CONTRACT_ADDRESS;
const authContract = new web3.eth.Contract(AuthABI, contractAddress);

// Configuration des en-têtes avec le token JWT
const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };
};

/**
 * Inscription d'un nouvel utilisateur
 * @param {Object} donnees - Données d'inscription (nom, prenom, email, role)
 * @returns {Promise<Object>} - Réponse de l'API
 */
export const inscription = async (donnees) => {
  try {
    // 1. Appel à l'API backend pour vérifier les informations et générer un mot de passe
    const response = await axios.post(`${API_URL}/auth/inscription`, donnees);
    
    // 2. Si l'inscription backend réussit, on enregistre également dans la blockchain
    if (response.data.success) {
      console.log('Inscription réussie dans la base de données, enregistrement dans la blockchain...');
      
      // Récupérer les comptes disponibles
      const accounts = await web3.eth.getAccounts();
      
      // Hacher le mot de passe pour la blockchain (simulé ici - normalement fait côté backend)
      // Note: Dans une implémentation réelle, le backend enverrait déjà le hash
      const passwordHash = web3.utils.keccak256(response.data.motDePasse);
      
      // Enregistrer l'utilisateur dans la blockchain
      await authContract.methods.inscrireUtilisateur(
        donnees.nom,
        donnees.prenom,
        donnees.email,
        passwordHash,
        parseInt(donnees.role)
      ).send({ from: accounts[0] });
      
      console.log('Utilisateur enregistré avec succès dans la blockchain');
    }
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Erreur lors de l\'inscription');
    }
    throw error;
  }
};

/**
 * Connexion d'un utilisateur
 * @param {Object} donnees - Données de connexion (email, motDePasse, role)
 * @returns {Promise<Object>} - Réponse de l'API avec token et informations utilisateur
 */
export const connexion = async (donnees) => {
  try {
    // 1. Appel à l'API backend pour l'authentification
    const response = await axios.post(`${API_URL}/auth/connexion`, donnees);
    
    // 2. Si la connexion backend réussit, on vérifie également dans la blockchain
    if (response.data.success) {
      console.log('Connexion réussie dans la base de données, vérification dans la blockchain...');
      
      // Récupérer les comptes disponibles
      const accounts = await web3.eth.getAccounts();
      
      // Hacher le mot de passe pour la blockchain
      const passwordHash = web3.utils.keccak256(donnees.motDePasse);
      
      try {
        // Authentifier l'utilisateur via la blockchain
        await authContract.methods.authentifierUtilisateur(
          donnees.email,
          passwordHash,
          parseInt(donnees.role)
        ).send({ from: accounts[0] });
        
        console.log('Utilisateur authentifié avec succès dans la blockchain');
      } catch (blockchainError) {
        console.error('Erreur lors de l\'authentification blockchain:', blockchainError);
        // On continue même en cas d'erreur blockchain pour ne pas bloquer l'utilisateur
        // mais on pourrait implémenter une politique plus stricte si nécessaire
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Erreur lors de la connexion');
    }
    throw error;
  }
};

/**
 * Vérification de la validité du token JWT
 * @returns {Promise<Object>} - Réponse de l'API avec informations utilisateur
 */
export const verifierToken = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/verifier-token`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Token invalide');
    }
    throw error;
  }
};

/**
 * Changement de mot de passe
 * @param {Object} donnees - Données de changement (ancienMotDePasse, nouveauMotDePasse)
 * @returns {Promise<Object>} - Réponse de l'API
 */
export const changerMotDePasse = async (donnees) => {
  try {
    // 1. Appel à l'API backend pour changer le mot de passe
    const response = await axios.post(`${API_URL}/auth/changer-mot-de-passe`, donnees, getAuthConfig());
    
    // 2. Si le changement backend réussit, on met également à jour dans la blockchain
    if (response.data.success) {
      console.log('Mot de passe changé avec succès dans la base de données, mise à jour dans la blockchain...');
      
      // Récupérer les comptes disponibles
      const accounts = await web3.eth.getAccounts();
      
      // Récupérer l'email de l'utilisateur connecté
      const userInfo = await verifierToken();
      const email = userInfo.utilisateur.email;
      
      // Hacher les mots de passe pour la blockchain
      const ancienPasswordHash = web3.utils.keccak256(donnees.ancienMotDePasse);
      const nouveauPasswordHash = web3.utils.keccak256(donnees.nouveauMotDePasse);
      
      try {
        // Mettre à jour le mot de passe dans la blockchain
        await authContract.methods.modifierMotDePasse(
          email,
          ancienPasswordHash,
          nouveauPasswordHash
        ).send({ from: accounts[0] });
        
        console.log('Mot de passe mis à jour avec succès dans la blockchain');
      } catch (blockchainError) {
        console.error('Erreur lors de la mise à jour du mot de passe dans la blockchain:', blockchainError);
        // On continue même en cas d'erreur blockchain pour ne pas bloquer l'utilisateur
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Erreur lors du changement de mot de passe');
    }
    throw error;
  }
};

/**
 * Récupération du profil utilisateur
 * @returns {Promise<Object>} - Réponse de l'API avec informations du profil
 */
export const getProfil = async () => {
  try {
    const response = await axios.get(`${API_URL}/users/profil`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Erreur lors de la récupération du profil');
    }
    throw error;
  }
};

/**
 * Récupération des logs d'authentification
 * @returns {Promise<Object>} - Réponse de l'API avec logs d'authentification
 */
export const getLogs = async () => {
  try {
    const response = await axios.get(`${API_URL}/users/logs`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Erreur lors de la récupération des logs');
    }
    throw error;
  }
};
