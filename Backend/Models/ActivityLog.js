const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['LOGIN', 'REGISTER', 'LOGOUT', 'CREATE_ISSUE', 'UPDATE_STATUS', 'COMMENT', 'DELETE_ISSUE', 'BLOCK_USER', 'UNBLOCK_USER', 'CREATE_ADMIN', 'UPDATE_PROFILE', 'FORGOT_PASSWORD', 'ASSIGN_ISSUE', 'ESCALATE_ISSUE', 'REASSIGN_ISSUE', 'EDIT_ISSUE', 'SEND_INQUIRY']
    },
    ipAddress: {
        type: String
    },
    details: {
        type: mongoose.Schema.Types.Mixed, // Flexible field for extra data
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
