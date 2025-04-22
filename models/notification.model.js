const { pool } = require('../config/database');

// Notification model
class Notification {
  // Get all notifications for a user
  static async findByUser(userId, userType) {
    try {
      const [rows] = await pool.query(`
        SELECT * FROM notifications 
        WHERE destinataire_id = ? AND destinataire_type = ?
        ORDER BY date_envoi DESC
      `, [userId, userType]);
      return rows;
    } catch (error) {
      console.error(`Error finding notifications for user: ${error.message}`);
      throw error;
    }
  }

  // Get unread notifications for a user
  static async findUnreadByUser(userId, userType) {
    try {
      const [rows] = await pool.query(`
        SELECT * FROM notifications 
        WHERE destinataire_id = ? AND destinataire_type = ? AND est_lu = false
        ORDER BY date_envoi DESC
      `, [userId, userType]);
      return rows;
    } catch (error) {
      console.error(`Error finding unread notifications for user: ${error.message}`);
      throw error;
    }
  }

  // Create new notification
  static async create(notificationData) {
    try {
      const [result] = await pool.query(
        `INSERT INTO notifications (destinataire_id, destinataire_type, message, date_envoi, est_lu) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          notificationData.destinataire_id,
          notificationData.destinataire_type,
          notificationData.message,
          notificationData.date_envoi || new Date(),
          notificationData.est_lu || false
        ]
      );
      
      return { id: result.insertId, ...notificationData };
    } catch (error) {
      console.error(`Error creating notification: ${error.message}`);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(id) {
    try {
      const [result] = await pool.query(
        `UPDATE notifications SET est_lu = true WHERE id = ?`,
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error marking notification as read: ${error.message}`);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId, userType) {
    try {
      const [result] = await pool.query(
        `UPDATE notifications SET est_lu = true WHERE destinataire_id = ? AND destinataire_type = ?`,
        [userId, userType]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error marking all notifications as read: ${error.message}`);
      throw error;
    }
  }

  // Delete notification
  static async delete(id) {
    try {
      const [result] = await pool.query(
        `DELETE FROM notifications WHERE id = ?`,
        [id]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting notification: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Notification;
