import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';

// Création du contexte d'authentification
const AuthContext = createContext();

/**
 * Provider pour le contexte d'authentification
 * Gère l'état d'authentification et les fonctions associées
 */
export const AuthProvider = ({ children }) => {
  // État pour stocker les informations de l'utilisateur connecté
  const [currentUser, setCurrentUser] = useState(null);
  // État pour indiquer si l'authentification est en cours de vérification
  const [loading, setLoading] = useState(true);
  // État pour stocker les erreurs d'authentification
  const [error, setError] = useState(null);

  // Configuration de l'URL de base de l'API
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

  /**
   * Vérifie si l'utilisateur est déjà connecté au chargement de l'application
   */
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          // Configuration des en-têtes avec le token
          const config = {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          };
          
          // Appel à l'API pour vérifier le token
          const response = await axios.get(`${API_URL}/auth/verify-token`, config);
          
          if (response.data.success) {
            setCurrentUser(response.data.user);
          } else {
            // Token invalide, supprimer du localStorage
            localStorage.removeItem('authToken');
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du token:', error);
          localStorage.removeItem('authToken');
          setCurrentUser(null);
        }
      }
      
      setLoading(false);
    };
    
    checkAuthStatus();
  }, [API_URL]);

  /**
   * Fonction d'inscription d'un utilisateur
   * @param {string} nom - Nom de l'utilisateur
   * @param {string} prenom - Prénom de l'utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} role - Rôle de l'utilisateur
   * @returns {Promise<Object>} - Résultat de l'inscription
   */
  const register = async (nom, prenom, email, role) => {
    setError(null);
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const body = JSON.stringify({ nom, prenom, email, role });
      
      const response = await axios.post(`${API_URL}/auth/register`, body, config);
      
      if (response.data.success) {
        return { success: true, message: response.data.message };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'inscription';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  /**
   * Fonction de connexion d'un utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe de l'utilisateur
   * @param {string} role - Rôle sélectionné par l'utilisateur
   * @returns {Promise<Object>} - Résultat de la connexion
   */
  const login = async (email, password, role) => {
    setError(null);
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const body = JSON.stringify({ email, password, role });
      
      const response = await axios.post(`${API_URL}/auth/login`, body, config);
      
      if (response.data.success) {
        // Stocker le token dans le localStorage
        localStorage.setItem('authToken', response.data.token);
        
        // Mettre à jour l'état de l'utilisateur
        setCurrentUser(response.data.user);
        
        return { success: true };
      } else {
        setError(response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la connexion';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  /**
   * Fonction de déconnexion
   */
  const logout = () => {
    // Supprimer le token du localStorage
    localStorage.removeItem('authToken');
    // Réinitialiser l'état de l'utilisateur
    setCurrentUser(null);
  };

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   * @param {string|Array} roles - Rôle(s) à vérifier
   * @returns {boolean} - Vrai si l'utilisateur a le rôle spécifié
   */
  const hasRole = (roles) => {
    if (!currentUser) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(currentUser.role);
    }
    
    return currentUser.role === roles;
  };

  /**
   * Récupère les informations de l'utilisateur depuis le backend
   * @returns {Promise<Object>} - Informations de l'utilisateur
   */
  const getUserInfo = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        return { success: false, message: 'Non authentifié' };
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/auth/user`, config);
      
      if (response.data.success) {
        // Mettre à jour l'état de l'utilisateur avec les informations les plus récentes
        setCurrentUser(response.data.user);
        return { success: true, user: response.data.user };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la récupération des informations';
      return { success: false, message: errorMessage };
    }
  };

  /**
   * Récupère les journaux d'authentification de l'utilisateur
   * @returns {Promise<Object>} - Journaux d'authentification
   */
  const getAuthLogs = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        return { success: false, message: 'Non authentifié' };
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/auth/logs`, config);
      
      if (response.data.success) {
        return { success: true, logs: response.data.logs };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la récupération des journaux';
      return { success: false, message: errorMessage };
    }
  };

  /**
   * Vérifie si l'utilisateur est authentifié via la blockchain
   * @returns {Promise<Object>} - Résultat de la vérification
   */
  const verifyBlockchainAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        return { success: false, message: 'Non authentifié' };
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/auth/verify-blockchain`, config);
      
      return { 
        success: response.data.success, 
        verified: response.data.verified,
        message: response.data.message 
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la vérification blockchain';
      return { success: false, message: errorMessage };
    }
  };

  // Valeur du contexte à fournir aux composants enfants
  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    hasRole,
    getUserInfo,
    getAuthLogs,
    verifyBlockchainAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook personnalisé pour utiliser le contexte d'authentification
 * @returns {Object} - Contexte d'authentification
 */
export const useAuth = () => {
  return useContext(AuthContext);
};
