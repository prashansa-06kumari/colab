const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'drawing']
  },
  changeType: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  contentLength: {
    type: Number,
    default: 0
  },
  preview: {
    type: String,
    default: ''
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
historySchema.index({ userId: 1, date: 1 });
historySchema.index({ userId: 1, timestamp: -1 });
historySchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('History', historySchema);
