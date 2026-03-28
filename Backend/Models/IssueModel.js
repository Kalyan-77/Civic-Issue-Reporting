const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['Garbage', 'Streetlight', 'Pothole', 'Water Leakage', 'Other'], required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
    state: { type: String, default: '' },
    area: { type: String, default: 'Unknown' }
  },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  image: { type: String }, // image URL or file path
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isEscalated: { type: Boolean, default: false },
  escalationReason: { type: String },
  comments: [commentSchema],
  resolvedAt: { type: Date }
});

// Professional Indexing for Performance
issueSchema.index({ status: 1 });
issueSchema.index({ category: 1 });
issueSchema.index({ createdBy: 1 });
issueSchema.index({ assignedTo: 1 });
issueSchema.index({ createdAt: -1 }); // Fast sorting by newest

module.exports = mongoose.model('Issue', issueSchema);
