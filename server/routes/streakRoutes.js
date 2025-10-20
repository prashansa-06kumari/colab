/**
 * Streak Routes
 * API endpoints for streak and activity tracking
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { recordActivity, getUserStreakData, getMotivationalMessage, testStreak, forceUpdateStreak } = require('../controllers/streakController');

/**
 * GET /api/streak/data
 * Get user's streak and activity data
 */
router.get('/data', authenticateToken, async (req, res) => {
  try {
    const result = await getUserStreakData(req.user.id);
    
    if (result.success) {
      const motivationalMessage = getMotivationalMessage(result.currentStreak);
      res.json({
        success: true,
        ...result,
        motivationalMessage
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in get streak data route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/streak/activity
 * Record user activity
 */
router.post('/activity', authenticateToken, async (req, res) => {
  try {
    const { activityType, details } = req.body;
    
    if (!activityType) {
      return res.status(400).json({
        success: false,
        error: 'Activity type is required'
      });
    }

    const result = await recordActivity(req.user.id, activityType, details);
    
    if (result.success) {
      const motivationalMessage = getMotivationalMessage(result.currentStreak);
      res.json({
        success: true,
        ...result,
        motivationalMessage
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in record activity route:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/streak/test
 * Test endpoint to manually trigger streak update
 */
router.post('/test', authenticateToken, testStreak);

/**
 * POST /api/streak/force-update
 * Force update streak for testing
 */
router.post('/force-update', authenticateToken, forceUpdateStreak);

/**
 * GET /api/streak/debug
 * Debug endpoint to check server status
 */
router.get('/debug', (req, res) => {
  console.log('🔍 Debug endpoint hit');
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
