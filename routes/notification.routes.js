const express = require('express');
const NotificationController = require('../controllers/notification.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Protected routes
router.use(verifyToken);

// Get all notifications for a user
router.get('/', NotificationController.getUserNotifications);

// Get unread notifications for a user
router.get('/unread', NotificationController.getUnreadNotifications);

// Mark notification as read
router.put('/:id/read', NotificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', NotificationController.markAllAsRead);

// Create notification (accessible by administrators)
router.post('/', 
  checkRole(['encadrant_academique', 'encadrant_professionnel', 'responsable_universitaire', 'responsable_entreprise']), 
  NotificationController.createNotification);

// Delete notification
router.delete('/:id', NotificationController.deleteNotification);

module.exports = router;
