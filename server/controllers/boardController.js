/**
 * Board Controller
 * Handles collaborative board operations (get and save board data)
 */

const Board = require('../models/Board');
const BoardHistory = require('../models/BoardHistory');

/**
 * Get board content for a specific room
 * GET /api/board/:roomId
 */
const getBoard = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Validate room ID
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    // Find board for the room
    let board = await Board.findOne({ roomId });

    // If no board exists, create a new one
    if (!board) {
      board = new Board({
        roomId,
        content: '',
        contentType: 'text'
      });
      await board.save();
    }

    res.status(200).json({
      success: true,
      data: {
        board: {
          id: board._id,
          roomId: board.roomId,
          content: board.content,
          contentType: board.contentType,
          lastModified: board.lastModified,
          lastModifiedBy: board.lastModifiedBy
        }
      }
    });
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching board'
    });
  }
};

/**
 * Update board content for a specific room
 * PUT /api/board/:roomId
 */
const updateBoard = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, contentType = 'text' } = req.body;
    const userId = req.user._id; // From auth middleware

    // Validate room ID
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    // Validate content
    if (content === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Find existing board or create new one
    let board = await Board.findOne({ roomId });
    
    if (!board) {
      // Create new board
      board = new Board({
        roomId,
        content: content || '',
        contentType,
        lastModifiedBy: userId
      });
    } else {
      // Update existing board
      board.content = content;
      board.contentType = contentType;
      board.lastModifiedBy = userId;
    }

    // Save board to database
    await board.save();

    // Save to history for undo/redo functionality
    const historyEntry = new BoardHistory({
      roomId,
      content: board.content,
      contentType: board.contentType,
      version: Date.now(), // Use timestamp as version
      createdBy: userId,
      action: 'edit',
      metadata: {
        changeType: 'content_update',
        changeSize: JSON.stringify(content).length,
        previousVersion: board.updatedAt
      }
    });
    await historyEntry.save();

    // Populate lastModifiedBy user information
    await board.populate('lastModifiedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Board updated successfully',
      data: {
        board: {
          id: board._id,
          roomId: board.roomId,
          content: board.content,
          contentType: board.contentType,
          lastModified: board.lastModified,
          lastModifiedBy: {
            id: board.lastModifiedBy._id,
            name: board.lastModifiedBy.name,
            email: board.lastModifiedBy.email
          }
        }
      }
    });
  } catch (error) {
    console.error('Update board error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating board'
    });
  }
};

/**
 * Get board history/versions (if needed for future features)
 * GET /api/board/:roomId/history
 */
const getBoardHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 10 } = req.query;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    // For now, just return the current board
    // In a real implementation, you might want to store version history
    const board = await Board.findOne({ roomId })
      .populate('lastModifiedBy', 'name email');

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        currentBoard: {
          id: board._id,
          roomId: board.roomId,
          content: board.content,
          contentType: board.contentType,
          lastModified: board.lastModified,
          lastModifiedBy: board.lastModifiedBy
        }
      }
    });
  } catch (error) {
    console.error('Get board history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching board history'
    });
  }
};

/**
 * Clear board content
 * DELETE /api/board/:roomId
 */
const clearBoard = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    // Find and update board
    const board = await Board.findOneAndUpdate(
      { roomId },
      {
        content: '',
        contentType: 'text',
        lastModifiedBy: userId
      },
      { new: true, upsert: true }
    );

    await board.populate('lastModifiedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Board cleared successfully',
      data: {
        board: {
          id: board._id,
          roomId: board.roomId,
          content: board.content,
          contentType: board.contentType,
          lastModified: board.lastModified,
          lastModifiedBy: board.lastModifiedBy
        }
      }
    });
  } catch (error) {
    console.error('Clear board error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while clearing board'
    });
  }
};

/**
 * Undo last change
 * POST /api/board/:roomId/undo
 */
const undoBoard = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    // Get the last history entry for this room
    const lastHistory = await BoardHistory.findOne({ roomId })
      .sort({ version: -1 })
      .populate('createdBy', 'name email');

    if (!lastHistory) {
      return res.status(404).json({
        success: false,
        message: 'No history found to undo'
      });
    }

    // Get the previous version
    const previousHistory = await BoardHistory.findOne({ 
      roomId,
      version: { $lt: lastHistory.version }
    }).sort({ version: -1 });

    if (!previousHistory) {
      return res.status(404).json({
        success: false,
        message: 'No previous version found to undo to'
      });
    }

    // Update board with previous content
    const board = await Board.findOneAndUpdate(
      { roomId },
      {
        content: previousHistory.content,
        contentType: previousHistory.contentType,
        lastModifiedBy: userId
      },
      { new: true, upsert: true }
    );

    // Save undo action to history
    const undoEntry = new BoardHistory({
      roomId,
      content: previousHistory.content,
      contentType: previousHistory.contentType,
      version: Date.now(),
      createdBy: userId,
      action: 'undo',
      metadata: {
        changeType: 'undo',
        previousVersion: lastHistory.version
      }
    });
    await undoEntry.save();

    await board.populate('lastModifiedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Board undone successfully',
      data: {
        board: {
          id: board._id,
          roomId: board.roomId,
          content: board.content,
          contentType: board.contentType,
          lastModified: board.lastModified,
          lastModifiedBy: board.lastModifiedBy
        }
      }
    });
  } catch (error) {
    console.error('Undo board error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while undoing board'
    });
  }
};

/**
 * Redo last undone change
 * POST /api/board/:roomId/redo
 */
const redoBoard = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    // Get the last undo action
    const lastUndo = await BoardHistory.findOne({ 
      roomId, 
      action: 'undo' 
    }).sort({ version: -1 });

    if (!lastUndo) {
      return res.status(404).json({
        success: false,
        message: 'No undo action found to redo'
      });
    }

    // Get the version that was undone
    const redoneVersion = await BoardHistory.findOne({
      roomId,
      version: lastUndo.metadata.previousVersion
    });

    if (!redoneVersion) {
      return res.status(404).json({
        success: false,
        message: 'No version found to redo'
      });
    }

    // Update board with redone content
    const board = await Board.findOneAndUpdate(
      { roomId },
      {
        content: redoneVersion.content,
        contentType: redoneVersion.contentType,
        lastModifiedBy: userId
      },
      { new: true, upsert: true }
    );

    // Save redo action to history
    const redoEntry = new BoardHistory({
      roomId,
      content: redoneVersion.content,
      contentType: redoneVersion.contentType,
      version: Date.now(),
      createdBy: userId,
      action: 'redo',
      metadata: {
        changeType: 'redo',
        previousVersion: lastUndo.version
      }
    });
    await redoEntry.save();

    await board.populate('lastModifiedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Board redone successfully',
      data: {
        board: {
          id: board._id,
          roomId: board.roomId,
          content: board.content,
          contentType: board.contentType,
          lastModified: board.lastModified,
          lastModifiedBy: board.lastModifiedBy
        }
      }
    });
  } catch (error) {
    console.error('Redo board error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while redoing board'
    });
  }
};

/**
 * Export board as JSON (text only)
 * GET /api/board/:roomId/export/json
 */
const exportBoardAsJSON = async (req, res) => {
  try {
    const { roomId } = req.params;

    const board = await Board.findOne({ roomId });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Extract only text content from HTML
    const textContent = extractTextFromHTML(board.content);

    const exportData = {
      roomId: board.roomId,
      textContent: textContent,
      exportedAt: new Date().toISOString(),
      wordCount: textContent.split(/\s+/).filter(word => word.length > 0).length,
      characterCount: textContent.length
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="board-${roomId}-text.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Export board as JSON error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting board'
    });
  }
};

/**
 * Export board as PDF
 * GET /api/board/:roomId/export/pdf
 */
const exportBoardAsPDF = async (req, res) => {
  try {
    const { roomId } = req.params;

    const board = await Board.findOne({ roomId });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Extract text content
    const textContent = extractTextFromHTML(board.content);

    // Create simple HTML for PDF conversion
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Board Export - ${roomId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .content { white-space: pre-wrap; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Board Export</h1>
          <p>Room: ${roomId}</p>
          <p>Exported: ${new Date().toLocaleString()}</p>
        </div>
        <div class="content">${textContent}</div>
        <div class="footer">
          <p>Generated by CollabSpace</p>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="board-${roomId}.html"`);
    res.send(htmlContent);
  } catch (error) {
    console.error('Export board as PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting board as PDF'
    });
  }
};

/**
 * Export board as PNG (text-based)
 * GET /api/board/:roomId/export/png
 */
const exportBoardAsPNG = async (req, res) => {
  try {
    const { roomId } = req.params;

    const board = await Board.findOne({ roomId });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    // Extract text content
    const textContent = extractTextFromHTML(board.content);

    // Create SVG with text content
    const svgContent = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="white" stroke="black" stroke-width="2"/>
        <text x="20" y="30" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="black">Board Export - ${roomId}</text>
        <text x="20" y="50" font-family="Arial, sans-serif" font-size="12" fill="gray">Exported: ${new Date().toLocaleString()}</text>
        <text x="20" y="80" font-family="Arial, sans-serif" font-size="14" fill="black">${textContent.replace(/\n/g, '&#10;').substring(0, 2000)}</text>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="board-${roomId}.svg"`);
    res.send(svgContent);
  } catch (error) {
    console.error('Export board as PNG error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting board as PNG'
    });
  }
};

/**
 * Helper function to extract text from HTML content
 */
const extractTextFromHTML = (htmlContent) => {
  if (!htmlContent) return '';
  
  // Remove HTML tags and decode entities
  let text = htmlContent
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .trim();
  
  return text;
};

/**
 * Get board history with pagination
 * GET /api/board/:roomId/history
 */
const getBoardHistoryEnhanced = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 20, page = 1 } = req.query;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    const skip = (page - 1) * limit;
    
    const history = await BoardHistory.find({ roomId })
      .sort({ version: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('createdBy', 'name email')
      .select('-content'); // Don't send full content for performance

    const total = await BoardHistory.countDocuments({ roomId });

    res.status(200).json({
      success: true,
      data: {
        history: history.map(entry => ({
          id: entry._id,
          version: entry.version,
          contentType: entry.contentType,
          action: entry.action,
          createdBy: entry.createdBy,
          timestamp: entry.timestamp,
          metadata: entry.metadata
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalEntries: total,
          hasMore: skip + history.length < total
        }
      }
    });
  } catch (error) {
    console.error('Get board history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching board history'
    });
  }
};

module.exports = {
  getBoard,
  updateBoard,
  getBoardHistory: getBoardHistoryEnhanced,
  clearBoard,
  undoBoard,
  redoBoard,
  exportBoardAsJSON,
  exportBoardAsPDF,
  exportBoardAsPNG
};
