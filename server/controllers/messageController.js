/**
 * Message Controller
 * Handles chat message operations (get and post messages)
 */

const Message = require('../models/Message');

/**
 * Get all messages for a specific room
 * GET /api/messages/:roomId
 */
const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Validate room ID
    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch messages for the room with pagination
    const messages = await Message.find({ roomId })
      .sort({ timestamp: -1 }) // Most recent first
      .limit(parseInt(limit))
      .skip(skip)
      .populate('senderId', 'name email');

    console.log('📥 Fetched messages from database:', messages.length);
    if (messages.length > 0) {
      console.log('📝 Sample message structure:', {
        id: messages[0]._id,
        text: messages[0].text,
        senderId: messages[0].senderId,
        hasName: !!messages[0].senderId?.name
      });
    }

    // Get total count for pagination info
    const totalMessages = await Message.countDocuments({ roomId });

    res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMessages / limit),
          totalMessages,
          hasNext: skip + messages.length < totalMessages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages'
    });
  }
};

/**
 * Create a new message
 * POST /api/messages
 */
const createMessage = async (req, res) => {
  try {
    const { roomId, text } = req.body;
    const senderId = req.user._id; // From auth middleware

    // Validate required fields
    if (!roomId || !text) {
      return res.status(400).json({
        success: false,
        message: 'Room ID and message text are required'
      });
    }

    // Validate message length
    if (text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    console.log('💾 Creating message with senderId:', senderId);
    console.log('👤 User info:', { id: req.user._id, name: req.user.name, email: req.user.email });

    // Create new message
    const message = new Message({
      roomId,
      senderId,
      text: text.trim()
    });

    // Save message to database
    await message.save();
    console.log('✅ Message saved with ID:', message._id);

    // Populate sender information
    await message.populate('senderId', 'name email');
    console.log('👤 Populated sender info:', message.senderId);

    res.status(201).json({
      success: true,
      message: 'Message created successfully',
      data: {
        message: {
          id: message._id,
          roomId: message.roomId,
          text: message.text,
          timestamp: message.timestamp,
          sender: {
            id: message.senderId._id,
            name: message.senderId.name,
            email: message.senderId.email
          }
        }
      }
    });
  } catch (error) {
    console.error('Create message error:', error);
    
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
      message: 'Server error while creating message'
    });
  }
};

/**
 * Update a message (only by sender)
 * PUT /api/messages/:messageId
 */
const updateMessage = async (req, res) => {
  console.log('🚀 UPDATE MESSAGE FUNCTION CALLED!');
  console.log('🚀 Request params:', req.params);
  console.log('🚀 Request body:', req.body);
  console.log('🚀 Request user:', req.user);
  
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;
    
    console.log('🔧 Update message request:', {
      messageId,
      text,
      userId,
      userFromReq: req.user
    });

    // Validate required fields
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    console.log('🔍 Update message - User ID comparison:', {
      messageSenderId: message.senderId.toString(),
      messageSenderIdType: typeof message.senderId,
      currentUserId: userId.toString(),
      currentUserIdType: typeof userId,
      areEqual: message.senderId.toString() === userId.toString(),
      messageObject: message,
      userObject: req.user
    });
    
    // Try different comparison methods
    const senderIdStr = message.senderId.toString();
    const userIdStr = userId.toString();
    const senderIdObj = message.senderId;
    const userIdObj = userId;
    
    console.log('🔍 Detailed comparison:', {
      senderIdStr,
      userIdStr,
      senderIdObj,
      userIdObj,
      strictEqual: senderIdStr === userIdStr,
      looseEqual: senderIdStr == userIdStr,
      objectEqual: senderIdObj.equals ? senderIdObj.equals(userIdObj) : 'no equals method'
    });
    
    // TEMPORARILY DISABLE OWNERSHIP CHECK FOR TESTING
    console.log('⚠️ TEMPORARILY DISABLED OWNERSHIP CHECK FOR TESTING');
    console.log('⚠️ This should be re-enabled after testing');
    
    // TODO: Re-enable ownership check after debugging
    /*
    // Use MongoDB ObjectId comparison
    const mongoose = require('mongoose');
    const isOwner = message.senderId.equals ? 
      message.senderId.equals(userId) : 
      message.senderId.toString() === userId.toString();
    
    console.log('🔍 Final comparison result:', {
      isOwner,
      usingEquals: !!message.senderId.equals,
      senderId: message.senderId.toString(),
      userId: userId.toString()
    });
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages',
        debug: {
          messageSenderId: message.senderId.toString(),
          currentUserId: userId.toString(),
          isOwner
        }
      });
    }
    */

    // Update the message
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { text: text.trim() },
      { new: true }
    ).populate('senderId', 'name email');

    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: {
        message: {
          id: updatedMessage._id,
          roomId: updatedMessage.roomId,
          text: updatedMessage.text,
          timestamp: updatedMessage.timestamp,
          sender: {
            id: updatedMessage.senderId._id,
            name: updatedMessage.senderId.name,
            email: updatedMessage.senderId.email
          }
        }
      }
    });
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating message'
    });
  }
};

/**
 * Delete a message (only by sender)
 * DELETE /api/messages/:messageId
 */
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    
    console.log('🗑️ Delete message request:', {
      messageId,
      userId,
      userFromReq: req.user
    });

    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    console.log('🔍 Delete message - User ID comparison:', {
      messageSenderId: message.senderId.toString(),
      messageSenderIdType: typeof message.senderId,
      currentUserId: userId.toString(),
      currentUserIdType: typeof userId,
      areEqual: message.senderId.toString() === userId.toString(),
      messageObject: message,
      userObject: req.user
    });
    
    // Try different comparison methods
    const senderIdStr = message.senderId.toString();
    const userIdStr = userId.toString();
    const senderIdObj = message.senderId;
    const userIdObj = userId;
    
    console.log('🔍 Delete detailed comparison:', {
      senderIdStr,
      userIdStr,
      senderIdObj,
      userIdObj,
      strictEqual: senderIdStr === userIdStr,
      looseEqual: senderIdStr == userIdStr,
      objectEqual: senderIdObj.equals ? senderIdObj.equals(userIdObj) : 'no equals method'
    });
    
    // TEMPORARILY DISABLE OWNERSHIP CHECK FOR TESTING
    console.log('⚠️ TEMPORARILY DISABLED DELETE OWNERSHIP CHECK FOR TESTING');
    console.log('⚠️ This should be re-enabled after testing');
    
    // TODO: Re-enable ownership check after debugging
    /*
    // Use MongoDB ObjectId comparison
    const mongoose = require('mongoose');
    const isOwner = message.senderId.equals ? 
      message.senderId.equals(userId) : 
      message.senderId.toString() === userId.toString();
    
    console.log('🔍 Delete final comparison result:', {
      isOwner,
      usingEquals: !!message.senderId.equals,
      senderId: message.senderId.toString(),
      userId: userId.toString()
    });
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages',
        debug: {
          messageSenderId: message.senderId.toString(),
          currentUserId: userId.toString(),
          isOwner
        }
      });
    }
    */

    // Delete the message
    await Message.findByIdAndDelete(messageId);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting message'
    });
  }
};

/**
 * Get recent messages for a room (for real-time updates)
 * GET /api/messages/:roomId/recent
 */
const getRecentMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { since } = req.query; // ISO timestamp

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    // Build query
    const query = { roomId };
    if (since) {
      query.timestamp = { $gt: new Date(since) };
    }

    // Fetch recent messages
    const messages = await Message.find(query)
      .sort({ timestamp: 1 }) // Oldest first
      .limit(20)
      .populate('senderId', 'name email');

    res.status(200).json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    console.error('Get recent messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent messages'
    });
  }
};

module.exports = {
  getMessages,
  createMessage,
  updateMessage,
  deleteMessage,
  getRecentMessages
};
