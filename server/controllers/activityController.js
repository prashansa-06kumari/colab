const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const User = require('../models/User');

// Record a new activity
const recordActivity = async (req, res) => {
  try {
    const { type, details } = req.body;
    const userId = req.user._id;
    
    console.log('📝 Recording activity:', { type, details, userId });

    // Create new activity
    const activity = new Activity({
      userId,
      type,
      details: details || '',
      date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    });

    await activity.save();
    console.log('✅ Activity saved to database:', activity._id);

    res.json({
      success: true,
      message: 'Activity recorded successfully',
      data: activity
    });
  } catch (error) {
    console.error('❌ Error recording activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record activity',
      error: error.message
    });
  }
};

// Get activities for a specific date
const getActivitiesForDate = async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user._id;

    const activities = await Activity.find({
      userId,
      date
    }).sort({ timestamp: -1 });

    console.log(`📅 Retrieved ${activities.length} activities for ${date}`);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('❌ Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
};

// Get all activities for user
const getAllActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 100, offset = 0 } = req.query;

    const activities = await Activity.find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Activity.countDocuments({ userId });

    console.log(`📊 Retrieved ${activities.length} activities (${total} total)`);

    res.json({
      success: true,
      data: activities,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('❌ Error fetching all activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
};

// Get activity statistics
const getActivityStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get total activities
    const totalActivities = await Activity.countDocuments({ userId });

    // Get activities by type
    const activitiesByType = await Activity.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get activities by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activitiesByDate = await Activity.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          timestamp: { $gte: thirtyDaysAgo }
        } 
      },
      { $group: { _id: '$date', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    console.log(`📈 Activity stats for user ${userId}:`, { totalActivities, activitiesByType, activitiesByDate });

    res.json({
      success: true,
      data: {
        totalActivities,
        activitiesByType,
        activitiesByDate
      }
    });
  } catch (error) {
    console.error('❌ Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics',
      error: error.message
    });
  }
};

// Clear all activities for user
const clearActivities = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Activity.deleteMany({ userId });
    console.log(`🗑️ Cleared ${result.deletedCount} activities for user ${userId}`);

    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} activities`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error clearing activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear activities',
      error: error.message
    });
  }
};

module.exports = {
  recordActivity,
  getActivitiesForDate,
  getAllActivities,
  getActivityStats,
  clearActivities
};
