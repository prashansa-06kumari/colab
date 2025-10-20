const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['login', 'logout', 'message', 'edit', 'drawing', 'points_given', 'points_received', 'download', 'test']
  },
  details: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  date: {
    type: String, // YYYY-MM-DD format for easy querying
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
activitySchema.index({ userId: 1, date: 1 });
activitySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Activity', activitySchema);
