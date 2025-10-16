/**
 * Board History Model
 * Tracks versions of board content for undo/redo functionality
 */

const mongoose = require('mongoose');

const boardHistorySchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  contentType: {
    type: String,
    enum: ['text', 'drawing', 'mixed'],
    default: 'text'
  },
  version: {
    type: Number,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['create', 'edit', 'undo', 'redo'],
    default: 'edit'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    changeType: String, // 'text_change', 'drawing_add', 'drawing_remove', etc.
    changeSize: Number, // Size of the change in characters or bytes
    previousVersion: Number // Reference to previous version
  }
}, {
  timestamps: true
});

// Index for efficient querying
boardHistorySchema.index({ roomId: 1, version: -1 });
boardHistorySchema.index({ roomId: 1, timestamp: -1 });

module.exports = mongoose.model('BoardHistory', boardHistorySchema);
