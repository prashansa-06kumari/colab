/**
 * Message Model
 * Defines the schema for chat messages in rooms
 */

const mongoose = require('mongoose');

/**
 * Message Schema
 * Stores chat messages with room and sender information
 */
const messageSchema = new mongoose.Schema({
  // ID of the room where the message was sent
  roomId: {
    type: String,
    required: [true, 'Room ID is required'],
    trim: true
  },
  
  // ID of the user who sent the message
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  
  // The actual message content
  text: {
    type: String,
    required: [true, 'Message text is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  
  // When the message was created (automatically set)
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

/**
 * Index for efficient querying by room
 * Improves performance when fetching messages for a specific room
 */
messageSchema.index({ roomId: 1, timestamp: -1 });

/**
 * Populate sender information when querying messages
 * Automatically includes user details with each message
 */
messageSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'senderId',
    select: 'name email'
  });
  next();
});

module.exports = mongoose.model('Message', messageSchema);
