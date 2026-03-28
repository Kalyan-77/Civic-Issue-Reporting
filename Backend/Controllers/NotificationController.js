const Notification = require('../Models/NotificationModel');
const io = require('../Config/socket');

// Create a notification (Internal function, can be exported if needed)
exports.createNotification = async (recipient, sender, type, issueId, message) => {
    try {
        const notification = new Notification({
            recipient,
            sender,
            type,
            issueId,
            message
        });
        await notification.save();
        
        // Emit socket notification to the recipient's room
        try {
            io.getIo().to(recipient.toString()).emit('new_notification', notification);
        } catch (socketError) {
            console.error('Socket.io error emitting notification:', socketError);
        }
        
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

// Get notifications for a user
exports.getUserNotifications = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: "Unauthorized. Please login." });
        }

        const userId = req.session.user._id || req.session.user.id;
        let query = { recipient: userId };

        // Optional: Filter by today
        if (req.query.filter === 'today') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            query.createdAt = { $gte: startOfDay };
        }

        // Optional: Filter by unread status
        if (req.query.unread === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .populate('sender', 'name profilePicture isMainAdmin date')
            .populate('issueId', 'title status priority category');

        // Count unread notifications (respecting the filter if applied)
        let unreadQuery = { recipient: userId, isRead: false };
        if (req.query.filter === 'today') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            unreadQuery.createdAt = { $gte: startOfDay };
        }

        const unreadCount = await Notification.countDocuments(unreadQuery);

        res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount,
            notifications
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// Mark a specific notification as read
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        // Ensure user owns this notification
        const userId = req.session.user._id || req.session.user.id;
        if (notification.recipient.toString() !== userId.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// Mark all notifications as read for a user
exports.markAllAsRead = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userId = req.session.user._id || req.session.user.id;

        await Notification.updateMany(
            { recipient: userId, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        const userId = req.session.user._id || req.session.user.id;
        // Ensure user owns this notification
        if (notification.recipient.toString() !== userId.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await Notification.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
