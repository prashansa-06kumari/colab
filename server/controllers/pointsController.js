/**
 * Points Controller
 * Handles points-related operations for the CollabSpace application
 */

const User = require('../models/User');

/**
 * Update points for users when points are given
 * @param {string} fromUserId - ID of user giving points
 * @param {string} toUserId - ID of user receiving points
 * @param {number} points - Number of points to transfer
 */
const updatePoints = async (fromUserId, toUserId, points) => {
  try {
    // Update receiver's points received
    await User.findByIdAndUpdate(
      toUserId,
      { $inc: { pointsReceived: points } },
      { new: true }
    );

    // Update sender's points given
    await User.findByIdAndUpdate(
      fromUserId,
      { $inc: { pointsGiven: points } },
      { new: true }
    );

    console.log(`✅ Points updated: ${points} points from ${fromUserId} to ${toUserId}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating points:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's points
 * @param {string} userId - User ID
 */
const getUserPoints = async (userId) => {
  try {
    const user = await User.findById(userId).select('pointsReceived pointsGiven');
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    return {
      success: true,
      pointsReceived: user.pointsReceived,
      pointsGiven: user.pointsGiven
    };
  } catch (error) {
    console.error('❌ Error getting user points:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all users' points for leaderboard
 */
const getAllUsersPoints = async () => {
  try {
    const users = await User.find({})
      .select('name pointsReceived pointsGiven')
      .sort({ pointsReceived: -1 });
    
    return {
      success: true,
      users: users.map(user => ({
        name: user.name,
        pointsReceived: user.pointsReceived,
        pointsGiven: user.pointsGiven
      }))
    };
  } catch (error) {
    console.error('❌ Error getting all users points:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  updatePoints,
  getUserPoints,
  getAllUsersPoints
};
