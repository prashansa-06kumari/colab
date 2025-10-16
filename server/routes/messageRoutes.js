/**
 * Message Routes
 * Handles chat message operations for rooms
 */

const express = require('express');
const router = express.Router();
const { 
  getMessages, 
  createMessage, 
  updateMessage,
  deleteMessage, 
  getRecentMessages 
} = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Test route to check if server is working
 */
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Message routes are working!' });
});

/**
 * Test update route
 */
router.put('/test-update', (req, res) => {
  console.log('🧪 Test update route called');
  res.json({ success: true, message: 'Update route is working!', body: req.body });
});

/**
 * GET /api/messages/:roomId/recent
 * Get recent messages since a specific timestamp
 * Query params: since (ISO timestamp)
 * Headers: Authorization: Bearer <token>
 */
router.get('/:roomId/recent', authenticateToken, getRecentMessages);

/**
 * POST /api/messages
 * Create a new message
 * Body: { roomId, text }
 * Headers: Authorization: Bearer <token>
 */
router.post('/', authenticateToken, createMessage);

/**
 * PUT /api/messages/:messageId
 * Update a message (only by sender)
 * Body: { text }
 * Headers: Authorization: Bearer <token>
 */
router.put('/:messageId', (req, res, next) => {
  console.log('🎯 PUT route matched!', {
    messageId: req.params.messageId,
    method: req.method,
    url: req.url,
    body: req.body
  });
  next();
}, authenticateToken, updateMessage);

/**
 * DELETE /api/messages/:messageId
 * Delete a message (only by sender)
 * Headers: Authorization: Bearer <token>
 */
router.delete('/:messageId', authenticateToken, deleteMessage);

/**
 * GET /api/messages/:roomId
 * Get all messages for a specific room
 * Query params: page, limit
 * Headers: Authorization: Bearer <token>
 */
router.get('/:roomId', authenticateToken, getMessages);

/**
 * Debug route to catch all requests
 */
router.all('*', (req, res) => {
  console.log('🔍 Unmatched route:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    path: req.path,
    params: req.params,
    body: req.body
  });
  res.status(404).json({
    success: false,
    message: 'Route not found',
    details: {
      method: req.method,
      url: req.url,
      availableRoutes: [
        'GET /api/messages/test',
        'GET /api/messages/:roomId',
        'POST /api/messages',
        'PUT /api/messages/:messageId',
        'DELETE /api/messages/:messageId'
      ]
    }
  });
});

module.exports = router;
