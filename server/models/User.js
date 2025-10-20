/**
 * User Model
 * Defines the schema for user accounts in the database
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Stores user authentication and profile information
 */
const userSchema = new mongoose.Schema({
  // User's display name
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  // User's email address (unique identifier)
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  // Hashed password for authentication
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  
  // Points system fields
  pointsReceived: {
    type: Number,
    default: 0,
    min: [0, 'Points cannot be negative']
  },
  
  pointsGiven: {
    type: Number,
    default: 0,
    min: [0, 'Points cannot be negative']
  },

  // Streak and activity tracking fields
  currentStreak: {
    type: Number,
    default: 0,
    min: [0, 'Streak cannot be negative']
  },

  longestStreak: {
    type: Number,
    default: 0,
    min: [0, 'Longest streak cannot be negative']
  },

  lastActiveDate: {
    type: Date,
    default: null
  },

  activityDates: [{
    date: {
      type: Date,
      required: true
    },
    activities: [{
      type: {
        type: String,
        enum: ['login', 'message', 'edit', 'drawing', 'points_given', 'points_received'],
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      details: {
        type: String,
        default: ''
      }
    }]
  }],

  totalActiveDays: {
    type: Number,
    default: 0,
    min: [0, 'Total active days cannot be negative']
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

/**
 * Hash password before saving to database
 * Runs before the user document is saved
 */
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Hash password with salt rounds of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare provided password with hashed password
 * @param {string} candidatePassword - Password to compare
 * @returns {boolean} - True if passwords match
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Remove password from JSON output for security
 * Ensures password is never sent to client
 */
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
