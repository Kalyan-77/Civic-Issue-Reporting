const express = require('express');
const router = express.Router();
const { getMyActivity, getAllActivities, deleteActivities, getTodayActivities } = require('../Controllers/ActivityController.js');

// @route   GET /activity/my-activity
// @desc    Get logged-in user's activity
// @access  Private
router.get('/my-activity', getMyActivity);

// @route   GET /activity/all
// @desc    Get all activities (Super Admin)
// @access  Private (Super Admin)
// @route   DELETE /activity/delete
// @desc    Delete selected activities
// @access  Private
router.delete('/delete', deleteActivities);

// @route   GET /activity/today
// @desc    Get today's activities (Admin)
// @access  Private (Admin)
router.get('/today', getTodayActivities);

module.exports = router;
