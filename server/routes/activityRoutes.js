const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  recordActivity,
  getActivitiesForDate,
  getAllActivities,
  getActivityStats,
  clearActivities
} = require('../controllers/activityController');

// Record a new activity
router.post('/record', authenticateToken, recordActivity);

// Get activities for a specific date
router.get('/date/:date', authenticateToken, getActivitiesForDate);

// Get all activities for user
router.get('/all', authenticateToken, getAllActivities);

// Get activity statistics
router.get('/stats', authenticateToken, getActivityStats);

// Clear all activities for user
router.delete('/clear', authenticateToken, clearActivities);

module.exports = router;
