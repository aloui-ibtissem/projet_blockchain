// controllers/notificationController.js
const db = require("../config/db");

exports.getMesNotifications = async (req, res) => {
  try {
    const { id, role } = req.user;
    const notifications = await notificationService.getNotifications(id, role);
    res.status(200).json(notifications);
  } catch (err) {
    console.error("Erreur getMesNotifications:", err);
    res.status(500).json({ error: err.message });
  }
};

