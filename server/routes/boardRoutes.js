/**
 * Board Routes
 * Handles collaborative board operations
 */

const express = require('express');
const router = express.Router();
const { 
  getBoard, 
  updateBoard, 
  getBoardHistory, 
  clearBoard,
  undoBoard,
  redoBoard,
  exportBoardAsJSON,
  exportBoardAsPDF,
  exportBoardAsPNG
} = require('../controllers/boardController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * GET /api/board/:roomId
 * Get board content for a specific room
 * Headers: Authorization: Bearer <token>
 */
router.get('/:roomId', authenticateToken, getBoard);

/**
 * PUT /api/board/:roomId
 * Update board content for a specific room
 * Body: { content, contentType }
 * Headers: Authorization: Bearer <token>
 */
router.put('/:roomId', authenticateToken, updateBoard);

/**
 * GET /api/board/:roomId/history
 * Get board history/versions
 * Query params: limit
 * Headers: Authorization: Bearer <token>
 */
router.get('/:roomId/history', authenticateToken, getBoardHistory);

/**
 * DELETE /api/board/:roomId
 * Clear board content
 * Headers: Authorization: Bearer <token>
 */
router.delete('/:roomId', authenticateToken, clearBoard);

/**
 * POST /api/board/:roomId/undo
 * Undo last change
 * Headers: Authorization: Bearer <token>
 */
router.post('/:roomId/undo', authenticateToken, undoBoard);

/**
 * POST /api/board/:roomId/redo
 * Redo last undone change
 * Headers: Authorization: Bearer <token>
 */
router.post('/:roomId/redo', authenticateToken, redoBoard);

/**
 * GET /api/board/:roomId/export/json
 * Export board as JSON (text only)
 * Headers: Authorization: Bearer <token>
 */
router.get('/:roomId/export/json', authenticateToken, exportBoardAsJSON);

/**
 * GET /api/board/:roomId/export/pdf
 * Export board as PDF (HTML format)
 * Headers: Authorization: Bearer <token>
 */
router.get('/:roomId/export/pdf', authenticateToken, exportBoardAsPDF);

/**
 * GET /api/board/:roomId/export/png
 * Export board as PNG (SVG format)
 * Headers: Authorization: Bearer <token>
 */
router.get('/:roomId/export/png', authenticateToken, exportBoardAsPNG);

module.exports = router;
