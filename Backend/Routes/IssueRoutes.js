const express = require('express');
const {
    createIssue,
    getAllIssues,
    getIssueById,
    updateIssueStatus,
    deleteIssue,
    getIssuesByType,
    getIssuesByUser,
    getIssuesByStatus,
    assignIssueToAdmin,
    getIssuesByAdmin,
    getAdminsByDepartment,
    addComment,
    getComments,
    deleteComment,
    editIssue,
    escalateIssue,
    reassignIssue
} = require('../Controllers/IssueController');

// Import authentication middleware
const { isSuperAdmin, isDeptAdmin, isAuthenticated } = require('../Middleware/authMiddleware');

const router = express.Router();

// Public/Citizen routes
router.post('/report', createIssue);
router.get('/all', getAllIssues);
router.get('/:id', getIssueById);

// Admin routes - require authentication
router.put('/update/:id', isAuthenticated, updateIssueStatus);
router.put('/edit/:id', isAuthenticated, editIssue);
router.delete('/delete/:id', isAuthenticated, deleteIssue);

// Category and status filters
router.get('/type/:category', getIssuesByType);
router.get('/status/:status', getIssuesByStatus);

// User-specific routes
router.get('/user/:userId', isAuthenticated, getIssuesByUser);

// Assignment routes
router.put('/assign/:issueId', isSuperAdmin, assignIssueToAdmin);
router.put('/reassign/:issueId', isDeptAdmin, reassignIssue);
// Get all dept_admins for a department with their current load (for Super Admin UI)
router.get('/admins/by-department/:department', isSuperAdmin, getAdminsByDepartment);

// Escalation routes - SUPER ADMIN ONLY
router.put('/escalate/:issueId', isSuperAdmin, escalateIssue);

// Department admin routes
router.get('/admin/:adminId', isDeptAdmin, getIssuesByAdmin);

// Comment routes
router.post('/:issueId/comment', isAuthenticated, addComment);
router.get('/:issueId/comments', getComments);
router.delete('/:issueId/comment/:commentId', isAuthenticated, deleteComment);

module.exports = router;