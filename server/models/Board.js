/**
 * Board Model
 * Defines the schema for collaborative whiteboard/editor content
 */

const mongoose = require('mongoose');

/**
 * Board Schema
 * Stores collaborative content for rooms (text editor or drawing data)
 */
const boardSchema = new mongoose.Schema({
  // ID of the room this board belongs to
  roomId: {
    type: String,
    required: [true, 'Room ID is required'],
    unique: true, // Each room can only have one board
    trim: true
  },
  
  // The collaborative content (can be text editor content or drawing data)
  content: {
    type: String,
    default: '',
    trim: true
  },
  
  // Type of content stored (text, drawing, etc.)
  contentType: {
    type: String,
    enum: ['text', 'drawing', 'mixed'],
    default: 'text'
  },
  
  // Last user who modified the content
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // When the content was last updated
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

/**
 * Index for efficient querying by room
 * Improves performance when fetching board content
 */
boardSchema.index({ roomId: 1 });

/**
 * Update lastModified timestamp when content changes
 * Automatically tracks when board was last edited
 */
boardSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.lastModified = new Date();
  }
  next();
});

/**
 * Populate lastModifiedBy user information
 * Includes user details when querying board data
 */
boardSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'lastModifiedBy',
    select: 'name email'
  });
  next();
});

module.exports = mongoose.model('Board', boardSchema);
