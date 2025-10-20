const mongoose = require('mongoose');
const History = require('../models/History');
const User = require('../models/User');

// Record a new history entry
const recordHistory = async (req, res) => {
  try {
    const { type, changeType, content, contentLength, preview, details } = req.body;
    const userId = req.user._id;
    
    console.log('📚 Recording history:', { type, changeType, userId });

    // Create new history entry
    const history = new History({
      userId,
      type,
      changeType,
      content: content || '',
      contentLength: contentLength || 0,
      preview: preview || '',
      details: details || '',
      date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    });

    await history.save();
    console.log('✅ History saved to database:', history._id);

    res.json({
      success: true,
      message: 'History recorded successfully',
      data: history
    });
  } catch (error) {
    console.error('❌ Error recording history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record history',
      error: error.message
    });
  }
};

// Get history for a specific date
const getHistoryForDate = async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user._id;

    const history = await History.find({
      userId,
      date
    }).sort({ timestamp: -1 });

    console.log(`📅 Retrieved ${history.length} history entries for ${date}`);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('❌ Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
      error: error.message
    });
  }
};

// Get all history for user
const getAllHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 100, offset = 0, type } = req.query;

    const query = { userId };
    if (type) {
      query.type = type;
    }

    const history = await History.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await History.countDocuments(query);

    console.log(`📊 Retrieved ${history.length} history entries (${total} total)`);

    res.json({
      success: true,
      data: history,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('❌ Error fetching all history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
      error: error.message
    });
  }
};

// Get history statistics
const getHistoryStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get total history entries
    const totalHistory = await History.countDocuments({ userId });

    // Get history by type
    const historyByType = await History.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get history by change type
    const historyByChangeType = await History.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$changeType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get history by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historyByDate = await History.aggregate([
      { 
        $match: { 
          userId: new mongoose.Types.ObjectId(userId),
          timestamp: { $gte: thirtyDaysAgo }
        } 
      },
      { $group: { _id: '$date', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    console.log(`📈 History stats for user ${userId}:`, { totalHistory, historyByType, historyByChangeType, historyByDate });

    res.json({
      success: true,
      data: {
        totalHistory,
        historyByType,
        historyByChangeType,
        historyByDate
      }
    });
  } catch (error) {
    console.error('❌ Error fetching history stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history statistics',
      error: error.message
    });
  }
};

// Clear all history for user
const clearHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await History.deleteMany({ userId });
    console.log(`🗑️ Cleared ${result.deletedCount} history entries for user ${userId}`);

    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} history entries`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error clearing history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear history',
      error: error.message
    });
  }
};

module.exports = {
  recordHistory,
  getHistoryForDate,
  getAllHistory,
  getHistoryStats,
  clearHistory
};
