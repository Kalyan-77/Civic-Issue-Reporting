const ActivityLog = require('../Models/ActivityLog');
const Settings = require('../Models/SettingsModel');

// Helper function to log activity
exports.logActivity = async (userId, action, details = {}, ipAddress = '') => {
    try {
        const activity = new ActivityLog({
            user: userId,
            action,
            details,
            ipAddress
        });
        await activity.save();
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

// Get activities for the logged-in user
exports.getMyActivity = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const userId = req.session.user._id || req.session.user.id;

        const activities = await ActivityLog.find({ user: userId })
            .populate('user', 'name email role')
            .sort({ createdAt: -1 })
            .limit(50); // Limit to last 50 activities

        res.status(200).json({
            success: true,
            activities
        });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// Get all activities (Super Admin only)
exports.getAllActivities = async (req, res) => {
    try {
        if (!req.session || !req.session.user || !['super_admin', 'superadmin'].includes(req.session.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const { role, userId } = req.query;
        let query = {};

        if (userId) {
            query.user = userId;
        }

        const activities = await ActivityLog.find(query)
            .populate('user', 'name email role')
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({
            success: true,
            count: activities.length,
            activities
        });
    } catch (error) {
        console.error('Error fetching all activities:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// Delete selected activities
exports.deleteActivities = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { activityIds } = req.body;

        if (!activityIds || !Array.isArray(activityIds) || activityIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No activities selected for deletion' });
        }

        // Only allow users to delete their own activities, unless they are Super Admin
        const userId = req.session.user._id || req.session.user.id;
        const userRole = req.session.user.role;

        let query = { _id: { $in: activityIds } };

        if (!['super_admin', 'superadmin'].includes(userRole)) {
            // Regular users can only delete their own activities
            query.user = userId;
        }

        const result = await ActivityLog.deleteMany(query);

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'No activities found or unauthorized to delete' });
        }

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} activities deleted successfully`
        });
    } catch (error) {
        console.error('Error deleting activities:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// Get today's activities for admin dashboard
exports.getTodayActivities = async (req, res) => {
    try {
        if (!req.session || !req.session.user || !['super_admin', 'superadmin', 'dept_admin'].includes(req.session.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const userId = req.session.user._id || req.session.user.id;

        // Get start and end of current day
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        let query = {
            user: userId,
            createdAt: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        };

        const activities = await ActivityLog.find(query)
            .populate('user', 'name email role')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            count: activities.length,
            activities
        });
    } catch (error) {
        console.error('Error fetching today activities:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// Cleanup old logs based on user preferences
exports.cleanupLogs = async () => {
    try {
        

        // Find users with 7 days retention
        const settings7Days = await Settings.find({ activityLogRetention: '7_days' }).select('user');
        if (settings7Days.length > 0) {
            const date7DaysAgo = new Date();
            date7DaysAgo.setDate(date7DaysAgo.getDate() - 7);

            await ActivityLog.deleteMany({
                user: { $in: settings7Days.map(s => s.user) },
                createdAt: { $lt: date7DaysAgo }
            });
        }

        // Find users with 1 month retention
        const settings1Month = await Settings.find({ activityLogRetention: '1_month' }).select('user');
        if (settings1Month.length > 0) {
            const date1MonthAgo = new Date();
            date1MonthAgo.setMonth(date1MonthAgo.getMonth() - 1);

            await ActivityLog.deleteMany({
                user: { $in: settings1Month.map(s => s.user) },
                createdAt: { $lt: date1MonthAgo }
            });
        }

        console.log('Activity log cleanup completed');
    } catch (error) {
        console.error('Error during activity log cleanup:', error);
    }
};
