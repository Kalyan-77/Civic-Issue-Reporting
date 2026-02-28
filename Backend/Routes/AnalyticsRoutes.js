const express = require('express');
const router = express.Router();

const {
  getOverviewAnalytics,
  getIssuesByCategoryAnalytics,
  getIssuesByStatusAnalytics,
  getIssuesOverTimeAnalytics,
  getAdminPerformanceAnalytics,
  getEscalationAnalytics,
  getCategoryResolutionAnalytics,
  getIssueTrendsAnalytics,
  getIssuesByAreaAnalytics,
  getUserAnalytics,
  getHeroStats,
} = require('../Controllers/AnalyticsController');

const { isSuperAdmin } = require('../Middleware/authMiddleware');

// 🔐 SUPER ADMIN ONLY ANALYTICS ROUTES
router.get('/overview', isSuperAdmin, getOverviewAnalytics);
router.get('/issues-by-category', isSuperAdmin, getIssuesByCategoryAnalytics);
router.get('/issues-by-status', isSuperAdmin, getIssuesByStatusAnalytics);
router.get('/issues-over-time', isSuperAdmin, getIssuesOverTimeAnalytics);
router.get('/admin-performance', isSuperAdmin, getAdminPerformanceAnalytics);
router.get('/escalations', isSuperAdmin, getEscalationAnalytics);
router.get('/category-resolution', isSuperAdmin, getCategoryResolutionAnalytics);
router.get('/issue-trends', isSuperAdmin, getIssueTrendsAnalytics);
router.get('/issues-by-area', isSuperAdmin, getIssuesByAreaAnalytics);
router.get('/users', isSuperAdmin, getUserAnalytics);
router.get('/hero-stats', getHeroStats); // Public route

module.exports = router;
