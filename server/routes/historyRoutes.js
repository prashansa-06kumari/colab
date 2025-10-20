const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  recordHistory,
  getHistoryForDate,
  getAllHistory,
  getHistoryStats,
  clearHistory
} = require('../controllers/historyController');

// Record a new history entry
router.post('/record', authenticateToken, recordHistory);

// Get history for a specific date
router.get('/date/:date', authenticateToken, getHistoryForDate);

// Get all history for user
router.get('/all', authenticateToken, getAllHistory);

// Get history statistics
router.get('/stats', authenticateToken, getHistoryStats);

// Clear all history for user
router.delete('/clear', authenticateToken, clearHistory);

module.exports = router;
