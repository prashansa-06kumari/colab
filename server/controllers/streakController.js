/**
 * Streak Controller
 * Handles streak and activity tracking operations
 */

const User = require('../models/User');

/**
 * Record user activity and update streak
 * @param {string} userId - User ID
 * @param {string} activityType - Type of activity
 * @param {string} details - Additional details about the activity
 */
const recordActivity = async (userId, activityType, details = '') => {
  try {
    console.log('🔥 RECORD ACTIVITY STARTED');
    console.log('User ID:', userId);
    console.log('Activity Type:', activityType);
    
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found');
      return { success: false, error: 'User not found' };
    }

    console.log('✅ User found:', user.email);
    console.log('Current streak before:', user.currentStreak);
    console.log('Longest streak before:', user.longestStreak);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day
    const todayString = today.toDateString();

    console.log('📅 Today:', todayString);

    // Check if user was already active today
    let wasActiveToday = false;
    for (let activity of user.activityDates) {
      if (activity.date.toDateString() === todayString) {
        wasActiveToday = true;
        break;
      }
    }

    console.log('🔍 Was active today:', wasActiveToday);

    // Add activity record
    const activityRecord = {
      type: activityType,
      timestamp: new Date(),
      details: details
    };

    if (wasActiveToday) {
      // Add to existing day's activities
      for (let activity of user.activityDates) {
        if (activity.date.toDateString() === todayString) {
          activity.activities.push(activityRecord);
          break;
        }
      }
      console.log('📝 Added activity to existing day');
    } else {
      // Create new day entry
      user.activityDates.push({
        date: today,
        activities: [activityRecord]
      });
      console.log('📅 Created new day entry');
    }

    // ALWAYS update streak - simplified logic
    if (!wasActiveToday) {
      console.log('🌟 First activity of the day - updating streak');
      
      // Get yesterday's date
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();
      
      console.log('📅 Yesterday:', yesterdayString);
      
      // Check if user was active yesterday
      let wasActiveYesterday = false;
      for (let activity of user.activityDates) {
        if (activity.date.toDateString() === yesterdayString) {
          wasActiveYesterday = true;
          break;
        }
      }

      console.log('🔍 Was active yesterday:', wasActiveYesterday);

      // SIMPLE STREAK LOGIC
      if (wasActiveYesterday) {
        // Continue streak
        user.currentStreak += 1;
        console.log('✅ Continuing streak:', user.currentStreak);
      } else {
        // Start new streak
        user.currentStreak = 1;
        console.log('🌟 Starting new streak:', user.currentStreak);
      }

      // Update longest streak
      if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak;
        console.log('🏆 New longest streak:', user.longestStreak);
      }
    } else {
      console.log('📝 Already active today, no streak update');
    }

    // Always update these fields
    user.lastActiveDate = today;
    user.totalActiveDays = user.activityDates.length;

    console.log('💾 Final data before save:', {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalActiveDays: user.totalActiveDays
    });

    await user.save();
    console.log('✅ User saved successfully');

    return {
      success: true,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalActiveDays: user.totalActiveDays,
      isNewStreakDay: !wasActiveToday,
      isNewStreak: user.currentStreak === 1 && !wasActiveToday
    };
  } catch (error) {
    console.error('❌ Error recording activity:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's streak and activity data
 * @param {string} userId - User ID
 */
const getUserStreakData = async (userId) => {
  try {
    const user = await User.findById(userId).select(
      'currentStreak longestStreak lastActiveDate activityDates totalActiveDays'
    );
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Get activity data for the last 365 days
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const recentActivities = user.activityDates.filter(activity => 
      activity.date >= oneYearAgo
    );

    console.log('📊 Returning streak data:', {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalActiveDays: user.totalActiveDays,
      activityDatesCount: user.activityDates.length
    });

    return {
      success: true,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActiveDate: user.lastActiveDate,
      totalActiveDays: user.totalActiveDays,
      activities: recentActivities
    };
  } catch (error) {
    console.error('Error getting streak data:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get motivational message based on streak
 * @param {number} streak - Current streak count
 */
const getMotivationalMessage = (streak) => {
  if (streak === 0) {
    return "🌟 Start your journey today!";
  } else if (streak === 1) {
    return "🎉 Great start! Keep it going!";
  } else if (streak < 7) {
    return `🔥 ${streak}-day streak strong!`;
  } else if (streak < 30) {
    return `💪 ${streak}-day streak amazing!`;
  } else if (streak < 100) {
    return `🚀 ${streak}-day streak incredible!`;
  } else {
    return `🏆 ${streak}-day streak LEGENDARY!`;
  }
};

/**
 * Test endpoint to manually trigger streak update
 * POST /api/streak/test
 */
const testStreak = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('🧪 TEST STREAK STARTED');
    console.log('User ID:', userId);
    
    const result = await recordActivity(userId, 'test', 'Manual test activity');
    console.log('🧪 Test result:', result);
    
    res.json({
      success: true,
      message: 'Test streak updated',
      data: result
    });
  } catch (error) {
    console.error('Test streak error:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
};

/**
 * Force update streak for testing
 * POST /api/streak/force-update
 */
const forceUpdateStreak = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('🔧 FORCE UPDATE STREAK');
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Force set streak to 1 for testing
    user.currentStreak = 1;
    user.longestStreak = Math.max(user.longestStreak, 1);
    user.totalActiveDays = user.activityDates.length;
    user.lastActiveDate = new Date();

    await user.save();
    console.log('🔧 Force updated streak to 1');

    res.json({
      success: true,
      message: 'Streak force updated to 1',
      data: {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalActiveDays: user.totalActiveDays
      }
    });
  } catch (error) {
    console.error('Force update error:', error);
    res.status(500).json({
      success: false,
      message: 'Force update failed',
      error: error.message
    });
  }
};

module.exports = {
  recordActivity,
  getUserStreakData,
  getMotivationalMessage,
  testStreak,
  forceUpdateStreak
};
