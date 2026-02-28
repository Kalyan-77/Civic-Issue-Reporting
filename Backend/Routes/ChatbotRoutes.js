const express = require('express');
const router = express.Router();
const {
    getChatbotData,
    getFAQs,
    getIssueStatusById,
    getContactDetails
} = require('../Controllers/ChatbotController');

// @route   GET /chatbot/data
// @desc    Get all chatbot context data (issues, admins, FAQs)
// @access  Public
router.get('/data', getChatbotData);

// @route   GET /chatbot/faqs
// @desc    Get FAQ list
// @access  Public
router.get('/faqs', getFAQs);

// @route   GET /chatbot/issue/:id
// @desc    Get specific issue status and details
// @access  Public
router.get('/issue/:id', getIssueStatusById);

// @route   GET /chatbot/contacts
// @desc    Get contact details of admins
// @access  Public
router.get('/contacts', getContactDetails);

module.exports = router;
