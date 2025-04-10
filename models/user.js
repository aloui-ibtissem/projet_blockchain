/**
 * Modèle utilisateur
 * Gère les interactions avec la table utilisateurs dans la base de données
 */

const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

class UserModel {
  /**
   * Vérifie si un utilisateur existe dans la base de données
   * @param {string} email - Email de l'utilisateur
   * @param {number} roleId - ID du rôle
   * @returns {Promise<boolean>} - True si l'utilisateur existe
   */
  static async checkUserExists(email, roleId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM utilisateur WHERE email = ? AND role_id = ?',
        [email, roleId]
      );
      return rows.length > 0;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Récupère un utilisateur par son email
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<Object|null>} - Données de l'utilisateur ou null
   */
  static async getUserByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM utilisateur WHERE email = ?',
        [email]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Récupère un utilisateur par son ID
   * @param {number} id - ID de l'utilisateur
   * @returns {Promise<Object|null>} - Données de l'utilisateur ou null
   */
  static async getUserById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM utilisateur WHERE id = ?',
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Récupère les informations détaillées d'un utilisateur selon son rôle
   * @param {number} userId - ID de l'utilisateur
   * @param {number} roleId - ID du rôle
   * @returns {Promise<Object|null>} - Informations détaillées de l'utilisateur
   */
  static async getUserDetailsByRole(userId, roleId) {
    try {
      let table = '';
      
      // Déterminer la table en fonction du rôle
      switch (roleId) {
        case 1:
          table = 'etudiants';
          break;
        case 2:
          table = 'encadrants_academiques';
          break;
        case 3:
          table = 'encadrants_professionnels';
          break;
        case 4:
          table = 'responsables_universitaires';
          break;
        case 5:
          table = 'responsables_entreprises';
          break;
        default:
          throw new Error('Rôle non reconnu');
      }
      
      // Récupérer les informations de base de l'utilisateur
      const [userRows] = await pool.execute(
        'SELECT u.*, r.nom as role_nom FROM utilisateur u ' +
        'JOIN roles r ON u.role_id = r.id ' +
        'WHERE u.id = ?',
        [userId]
      );
      
      if (userRows.length === 0) {
        return null;
      }
      
      // Récupérer les informations spécifiques au rôle
      const [detailsRows] = await pool.execute(
        `SELECT * FROM ${table} WHERE utilisateur_id = ?`,
        [userId]
      );
      
      // Combiner les informations
      return {
        ...userRows[0],
        details: detailsRows.length > 0 ? detailsRows[0] : null
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Met à jour le mot de passe d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {string} password - Nouveau mot de passe (non haché)
   * @returns {Promise<boolean>} - True si la mise à jour a réussi
   */
  static async updatePassword(userId, password) {
    try {
      // Hacher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Mettre à jour le mot de passe dans la base de données
      const [result] = await pool.execute(
        'UPDATE utilisateur SET mot_de_passe = ? WHERE id = ?',
        [hashedPassword, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      throw error;
    }
  }

  /**
   * Met à jour l'adresse blockchain d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {string} address - Adresse blockchain
   * @returns {Promise<boolean>} - True si la mise à jour a réussi
   */
  static async updateBlockchainAddress(userId, address) {
    try {
      const [result] = await pool.execute(
        'UPDATE utilisateur SET blockchain_address = ? WHERE id = ?',
        [address, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'adresse blockchain:', error);
      throw error;
    }
  }

  /**
   * Enregistre un log d'authentification
   * @param {number} userId - ID de l'utilisateur
   * @param {string} action - Type d'action (login, register, etc.)
   * @param {string} ipAddress - Adresse IP
   * @param {string} userAgent - User-Agent du navigateur
   * @param {string} txHash - Hash de la transaction blockchain
   * @returns {Promise<number>} - ID du log créé
   */
  static async logAuthAction(userId, action, ipAddress, userAgent, txHash = null) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO auth_logs (utilisateur_id, action, ip_address, user_agent, blockchain_tx_hash) VALUES (?, ?, ?, ?, ?)',
        [userId, action, ipAddress, userAgent, txHash]
      );
      
      return result.insertId;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du log d\'authentification:', error);
      throw error;
    }
  }
}

module.exports = UserModel;
