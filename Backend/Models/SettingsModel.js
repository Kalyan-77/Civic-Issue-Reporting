const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    activityLogRetention: {
        type: String,
        enum: ['7_days', '1_month', 'manual'],
        default: 'manual'
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
