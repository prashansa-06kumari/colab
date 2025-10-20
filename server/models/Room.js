const mongoose = require('mongoose');

const roomMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
});

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [roomMemberSchema],
  isPrivate: {
    type: Boolean,
    default: false
  },
  maxMembers: {
    type: Number,
    default: 10
  },
  settings: {
    allowGuests: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    }
  },
  drawingData: {
    strokes: [{
      type: mongoose.Schema.Types.Mixed
    }],
    canvasState: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
roomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.lastActivity = Date.now();
  next();
});

// Add member to room
roomSchema.methods.addMember = function(userId, username) {
  const existingMember = this.members.find(member => member.userId.toString() === userId.toString());
  
  if (existingMember) {
    // Update existing member's online status
    existingMember.isOnline = true;
    existingMember.lastSeen = new Date();
    return existingMember;
  }
  
  // Add new member
  const newMember = {
    userId,
    username,
    joinedAt: new Date(),
    isOnline: true,
    lastSeen: new Date()
  };
  
  this.members.push(newMember);
  return newMember;
};

// Remove member from room
roomSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(member => member.userId.toString() === userId.toString());
  
  if (memberIndex !== -1) {
    this.members[memberIndex].isOnline = false;
    this.members[memberIndex].lastSeen = new Date();
    return this.members[memberIndex];
  }
  
  return null;
};

// Get online members
roomSchema.methods.getOnlineMembers = function() {
  return this.members.filter(member => member.isOnline);
};

// Check if user is member
roomSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.userId.toString() === userId.toString());
};

// Check if user is host
roomSchema.methods.isHost = function(userId) {
  return this.host.toString() === userId.toString();
};

// Get room summary
roomSchema.methods.getSummary = function() {
  return {
    roomId: this.roomId,
    name: this.name,
    description: this.description,
    host: this.host,
    memberCount: this.members.length,
    onlineCount: this.getOnlineMembers().length,
    isPrivate: this.isPrivate,
    createdAt: this.createdAt,
    lastActivity: this.lastActivity
  };
};

module.exports = mongoose.model('Room', roomSchema);
