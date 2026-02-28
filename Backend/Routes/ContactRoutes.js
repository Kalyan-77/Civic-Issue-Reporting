const express = require('express');
const router = express.Router();
const {
    submitContactForm,
    getContactMessages,
    markAsRead,
    markAllAsRead,
    toggleArchive
} = require('../Controllers/ContactController');
const { isDeptAdmin } = require('../Middleware/authMiddleware');

// @route   POST /contact/admin
// @desc    Submit a contact form inquiry
// @access  Public
router.post('/admin', submitContactForm);

// @route   GET /contact
// @desc    Get contact submissions for the logged-in admin (Filtered by recipient)
// @access  Private (Admin only)
router.get('/', isDeptAdmin, getContactMessages);

// @route   PUT /contact/:id/read
// @desc    Mark a contact message as read
// @access  Private (Admin only)
router.put('/:id/read', isDeptAdmin, markAsRead);

// @route   PUT /contact/read-all
// @desc    Mark all messages as read for the logged-in admin
// @access  Private (Admin only)
router.put('/read-all', isDeptAdmin, markAllAsRead);

// @route   PUT /contact/:id/archive
// @desc    Toggle archive/flag status of a message
// @access  Private (Admin only)
router.put('/:id/archive', isDeptAdmin, toggleArchive);

module.exports = router;
