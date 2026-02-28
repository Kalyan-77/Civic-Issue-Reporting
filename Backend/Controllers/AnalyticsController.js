const Issue = require('../Models/IssueModel');
const Users = require('../Models/UserModel');

// Helper to create date filter
const getDateFilter = (req) => {
  const { month, year } = req.query;
  if (!month || !year) return {}; // No filter if not provided

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  return { createdAt: { $gte: startDate, $lte: endDate } };
};

/**
 * 🔹 1. OVERVIEW ANALYTICS (TOP CARDS)
 */
exports.getOverviewAnalytics = async (req, res) => {
  try {
    const filter = getDateFilter(req);

    const totalIssues = await Issue.countDocuments(filter);
    const pendingIssues = await Issue.countDocuments({ ...filter, status: 'Pending' });
    const inProgressIssues = await Issue.countDocuments({ ...filter, status: 'In Progress' });
    const resolvedIssues = await Issue.countDocuments({ ...filter, status: 'Resolved' });
    const criticalIssues = await Issue.countDocuments({ ...filter, priority: 'high' });
    const escalatedIssues = await Issue.countDocuments({ ...filter, isEscalated: true });

    res.status(200).json({
      success: true,
      data: {
        totalIssues,
        pendingIssues,
        inProgressIssues,
        resolvedIssues,
        criticalIssues,
        escalatedIssues
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch overview analytics",
      error: error.message
    });
  }
};

/**
 * 🔹 2. ISSUES BY CATEGORY
 */
exports.getIssuesByCategoryAnalytics = async (req, res) => {
  try {
    const filter = getDateFilter(req);

    const analytics = await Issue.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      analytics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch category analytics",
      error: error.message
    });
  }
};

/**
 * 🔹 3. ISSUES BY STATUS
 */
exports.getIssuesByStatusAnalytics = async (req, res) => {
  try {
    const filter = getDateFilter(req);

    const analytics = await Issue.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      analytics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch status analytics",
      error: error.message
    });
  }
};

/**
 * 🔹 4. ISSUES OVER TIME (MONTHLY OR DAILY)
 */
exports.getIssuesOverTimeAnalytics = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = getDateFilter(req);

    let groupBy;
    let sort;
    let project;

    if (month && year) {
      // Group by Day if specific month selected
      project = {
        day: { $dayOfMonth: "$createdAt" },
        month: { $month: "$createdAt" },
        year: { $year: "$createdAt" }
      };
      groupBy = {
        _id: { day: "$day" },
        count: { $sum: 1 }
      };
      sort = { "_id.day": 1 };
    } else {
      // Group by Month (default)
      project = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" }
      };
      groupBy = {
        _id: { year: "$year", month: "$month" },
        count: { $sum: 1 }
      };
      sort = { "_id.year": 1, "_id.month": 1 };
    }

    const analytics = await Issue.aggregate([
      { $match: filter },
      { $project: project },
      { $group: groupBy },
      { $sort: sort }
    ]);

    // Format for frontend
    const formattedAnalytics = analytics.map(item => {
      if (month && year) {
        return {
          name: `${item._id.day} ${new Date(year, month - 1).toLocaleString('default', { month: 'short' })}`,
          count: item.count
        };
      } else {
        const date = new Date(item._id.year, item._id.month - 1);
        return {
          name: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
          count: item.count
        };
      }
    });

    res.status(200).json({
      success: true,
      analytics: formattedAnalytics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch time-based analytics",
      error: error.message
    });
  }
};

/**
 * 🔹 5. CATEGORY ADMIN PERFORMANCE
 */
exports.getAdminPerformanceAnalytics = async (req, res) => {
  try {
    const filter = getDateFilter(req);

    // Merge status filter with date filter
    const matchStage = { ...filter, status: "Resolved", assignedTo: { $ne: null } };

    const analytics = await Issue.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "admin"
        }
      },
      { $unwind: "$admin" },
      {
        $group: {
          _id: "$assignedTo",
          name: { $first: "$admin.name" },
          category: { $first: "$category" },
          profilePicture: { $first: "$admin.profilePicture" },
          resolvedCount: { $sum: 1 },
          avgResolutionTime: {
            $avg: { $subtract: ["$updatedAt", "$createdAt"] }
          }
        }
      },
      {
        $addFields: {
          avgResolutionDays: { $divide: ["$avgResolutionTime", 1000 * 60 * 60 * 24] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      analytics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin performance analytics",
      error: error.message
    });
  }
};

/**
 * 🔹 6. ESCALATION ANALYTICS
 */
exports.getEscalationAnalytics = async (req, res) => {
  try {
    // For escalations, we show ALL currently escalated issues regardless of date
    // to ensure critical issues are not hidden by date filters.
    const matchStage = { isEscalated: true };

    const totalEscalated = await Issue.countDocuments(matchStage);

    const byCategory = await Issue.aggregate([
      { $match: matchStage },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const byReason = await Issue.aggregate([
      { $match: matchStage },
      { $group: { _id: "$escalationReason", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEscalated,
        byCategory,
        byReason
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch escalation analytics",
      error: error.message
    });
  }
};

/**
 * 🔹 7. CATEGORY RESOLUTION TIME
 */
exports.getCategoryResolutionAnalytics = async (req, res) => {
  try {
    const filter = getDateFilter(req);
    const matchStage = { ...filter, status: 'Resolved' };

    const analytics = await Issue.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$category",
          avgResolutionTime: { $avg: { $subtract: ["$updatedAt", "$createdAt"] } }
        }
      },
      {
        $addFields: {
          avgResolutionDays: { $divide: ["$avgResolutionTime", 1000 * 60 * 60 * 24] }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      analytics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch category resolution analytics",
      error: error.message
    });
  }
};

/**
 * 🔹 8. USER ANALYTICS
 */
exports.getUserAnalytics = async (req, res) => {
  try {
    const totalUsers = await Users.countDocuments({ role: 'citizen' });
    const deptAdmins = await Users.countDocuments({ role: 'dept_admin' });
    const superAdmins = await Users.countDocuments({ role: 'super_admin' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        deptAdmins,
        superAdmins
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user analytics",
      error: error.message
    });
  }
};

/**
 * 🔹 9. ISSUE TRENDS (TOTAL vs RESOLVED)
 */
exports.getIssueTrendsAnalytics = async (req, res) => {
  try {
    const { year, timeframe } = req.query; // timeframe: 'weekly' or 'monthly'

    // Default to monthly if not specified, but check for 'weekly'
    const isWeekly = timeframe === 'weekly';
    const matchYear = parseInt(year) || new Date().getFullYear();

    let matchStage = {};
    let groupStage = {};

    if (isWeekly) {
      // Last 7 days
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      matchStage = {
        createdAt: { $gte: sevenDaysAgo }
      };

      groupStage = {
        day: { $dayOfMonth: "$date" },
        month: { $month: "$date" },
        year: { $year: "$date" }
      };
    } else {
      // Monthly (Full Year)
      matchStage = {
        createdAt: {
          $gte: new Date(matchYear, 0, 1),
          $lte: new Date(matchYear, 11, 31, 23, 59, 59)
        }
      };
      groupStage = {
        month: { $month: "$date" },
        year: { $year: "$date" }
      };
    }

    // 1. Total Issues (Created)
    const createdStats = await Issue.aggregate([
      { $match: matchStage },
      { $project: { date: "$createdAt" } },
      { $group: { _id: groupStage, count: { $sum: 1 } } }
    ]);

    // 2. Resolved Issues (Grouped by Created Date for consistency)
    const resolvedStats = await Issue.aggregate([
      {
        $match: {
          ...matchStage,
          status: 'Resolved'
        }
      },
      { $project: { date: "$createdAt" } },
      { $group: { _id: groupStage, count: { $sum: 1 } } }
    ]);

    // 3. Format & Merge
    let result = [];

    if (isWeekly) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();

      // Create array of last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);

        const dayNum = d.getDate();
        const monthNum = d.getMonth() + 1;
        const yearNum = d.getFullYear();

        // Find stats for this day
        const created = createdStats.find(item =>
          item._id.day === dayNum && item._id.month === monthNum && item._id.year === yearNum
        );
        const resolved = resolvedStats.find(item =>
          item._id.day === dayNum && item._id.month === monthNum && item._id.year === yearNum
        );

        result.push({
          name: days[d.getDay()], // e.g., "Mon"
          fullDate: `${dayNum}/${monthNum}`, // optional, for tooltip maybe?
          total: created ? created.count : 0,
          resolved: resolved ? resolved.count : 0
        });
      }
    } else {
      // Monthly formatting
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      // Initialize all months with 0
      for (let i = 0; i < 12; i++) {
        const monthNum = i + 1;

        const created = createdStats.find(item => item._id.month === monthNum);
        const resolved = resolvedStats.find(item => item._id.month === monthNum);

        result.push({
          name: monthNames[i],
          total: created ? created.count : 0,
          resolved: resolved ? resolved.count : 0
        });
      }
    }

    res.status(200).json({
      success: true,
      analytics: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch issue trends",
      error: error.message
    });
  }
};

/**
 * 🔹 10. ISSUES BY AREA (NEW)
 */
exports.getIssuesByAreaAnalytics = async (req, res) => {
  try {
    const filter = getDateFilter(req);

    const analytics = await Issue.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$location.area",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 } // Top 10 areas
    ]);

    // Handle null/unknown areas if any
    const formattedAnalytics = analytics.map(item => ({
      area: item._id || 'Unknown Area',
      count: item.count
    }));

    res.status(200).json({
      success: true,
      analytics: formattedAnalytics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch issues by area",
      error: error.message
    });
  }
};

/**
 * 🔹 11. HERO PAGE STATS (PUBLIC)
 */
exports.getHeroStats = async (req, res) => {
  try {
    const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });
    const activeCitizens = await Users.countDocuments({ role: 'citizen' });

    // Calculate average response time for resolved issues
    const resolutionStats = await Issue.aggregate([
      { $match: { status: 'Resolved' } },
      {
        $group: {
          _id: null,
          avgTime: { $avg: { $subtract: ["$updatedAt", "$createdAt"] } }
        }
      }
    ]);

    let avgResponseHours = '48h'; // Default fallback
    if (resolutionStats.length > 0 && resolutionStats[0].avgTime) {
      const avgMs = resolutionStats[0].avgTime;
      const hours = Math.round(avgMs / (1000 * 60 * 60));
      avgResponseHours = `${hours}h`;
    }

    res.status(200).json({
      success: true,
      data: {
        resolvedIssues,
        activeCitizens,
        avgResponse: avgResponseHours
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch hero stats",
      error: error.message
    });
  }
};
