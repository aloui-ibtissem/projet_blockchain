const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Notification controller
class NotificationController {
  // Get all notifications for a user
  static async getUserNotifications(req, res) {
    try {
      const notifications = await Notification.findByUser(req.userId, req.userRole);
      res.status(200).json({ notifications });
    } catch (error) {
      console.error('Error in getUserNotifications:', error);
      res.status(500).json({ message: 'Error getting notifications', error: error.message });
    }
  }
  
  // Get unread notifications for a user
  static async getUnreadNotifications(req, res) {
    try {
      const notifications = await Notification.findUnreadByUser(req.userId, req.userRole);
      res.status(200).json({ notifications });
    } catch (error) {
      console.error('Error in getUnreadNotifications:', error);
      res.status(500).json({ message: 'Error getting unread notifications', error: error.message });
    }
  }
  
  // Mark notification as read
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      
      const updated = await Notification.markAsRead(id);
      if (!updated) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      res.status(200).json({
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Error in markAsRead:', error);
      res.status(500).json({ message: 'Error marking notification as read', error: error.message });
    }
  }
  
  // Mark all notifications as read
  static async markAllAsRead(req, res) {
    try {
      await Notification.markAllAsRead(req.userId, req.userRole);
      
      res.status(200).json({
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      res.status(500).json({ message: 'Error marking all notifications as read', error: error.message });
    }
  }
  
  // Create notification
  static async createNotification(req, res) {
    try {
      const { destinataire_id, destinataire_type, message, sendEmail } = req.body;
      
      // Validate required fields
      if (!destinataire_id || !destinataire_type || !message) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Create notification in database
      const notificationData = {
        destinataire_id,
        destinataire_type,
        message,
        date_envoi: new Date(),
        est_lu: false
      };
      
      const newNotification = await Notification.create(notificationData);
      
      // Send email if requested
      if (sendEmail) {
        // Get user email
        let user;
        switch (destinataire_type) {
          case 'etudiant':
            user = await User.findById(destinataire_id, 'etudiant');
            break;
          case 'encadrant_academique':
            user = await User.findById(destinataire_id, 'encadrant_academique');
            break;
          case 'encadrant_professionnel':
            user = await User.findById(destinataire_id, 'encadrant_professionnel');
            break;
          case 'responsable_universitaire':
            user = await User.findById(destinataire_id, 'responsable_universitaire');
            break;
          case 'responsable_entreprise':
            user = await User.findById(destinataire_id, 'responsable_entreprise');
            break;
        }
        
        if (user && user.email) {
          const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: 'New Notification - Blockchain Internship Management System',
            text: message
          };
          
          transporter.sendMail(mailOptions);
        }
      }
      
      res.status(201).json({
        message: 'Notification created successfully',
        notification: newNotification
      });
    } catch (error) {
      console.error('Error in createNotification:', error);
      res.status(500).json({ message: 'Error creating notification', error: error.message });
    }
  }
  
  // Delete notification
  static async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      
      const deleted = await Notification.delete(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      res.status(200).json({
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteNotification:', error);
      res.status(500).json({ message: 'Error deleting notification', error: error.message });
    }
  }
}

module.exports = NotificationController;
