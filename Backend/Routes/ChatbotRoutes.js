const express = require('express');
const router = express.Router();
const {
    getChatbotData,
    getFAQs,
    getIssueStatusById,
    getContactDetails,
    chatWithAI
} = require('../Controllers/ChatbotController');

// @route   GET /chatbot/data
// --- Existing routes ---
router.get('/data', getChatbotData);
router.get('/faqs', getFAQs);
router.get('/issue/:id', getIssueStatusById);
router.get('/contacts', getContactDetails);

// @route   POST /chatbot/ai
// @desc    Dynamic AI chatbot endpoint (Gemini)
// @access  Public
router.post('/ai', chatWithAI);

module.exports = router;
