const express = require('express');
const router = express.Router();
const {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../Controllers/NotificationController');

// Middleware to check authentication (Assume it's in a shared location)
// If not, we can assume the session is populated.

// Get all notifications for the user
router.get('/', getUserNotifications);

// Mark a single notification as read
router.put('/:id/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Delete a notification
router.delete('/:id', deleteNotification);

module.exports = router;
