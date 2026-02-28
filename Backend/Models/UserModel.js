const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },

  password: { type: String, required: true },

  mobile: { type: String, required: true },

  role: {
    type: String,
    enum: ['citizen', 'dept_admin', 'super_admin'],
    default: 'citizen'
  },

  // ✅ Only for dept_admin
  department: {
    type: String,
    enum: ['Potholes', 'Garbage', 'Streetlight', 'Water Leakage', 'Other'],
    required: function () {
      return this.role === 'dept_admin';
    }
  },

  location: {
    address: { type: String, default: '' },
    state: { type: String, default: '' },
    area: { type: String, default: '' }
  },

  profilePicture: {
    type: String,
    default: 'default-profile.png'
  },

  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: {
    type: String,
    default: ''
  }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
