const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Generate unique room ID
const generateRoomId = () => {
  return uuidv4().substring(0, 8).toUpperCase();
};

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, isPrivate, maxMembers, settings } = req.body;
    
    // Generate unique room ID
    let roomId;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      roomId = generateRoomId();
      const existingRoom = await Room.findOne({ roomId });
      if (!existingRoom) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate unique room ID' 
      });
    }
    
    // Create room
    const room = new Room({
      roomId,
      name: name || 'Untitled Room',
      description: description || '',
      host: req.user.id,
      isPrivate: isPrivate || false,
      maxMembers: maxMembers || 10,
      settings: settings || {
        allowGuests: false,
        requireApproval: false
      }
    });
    
    // Add host as first member
    room.addMember(req.user.id, req.user.name);
    
    await room.save();
    
    res.status(201).json({
      success: true,
      data: {
        room: room.getSummary(),
        joinLink: `${process.env.FRONTEND_URL}/room/${roomId}`
      }
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/rooms
// @desc    Get user's rooms
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { host: req.user.id },
        { 'members.userId': req.user.id }
      ]
    })
    .populate('host', 'name email')
    .sort({ lastActivity: -1 })
    .limit(20);
    
    const roomSummaries = rooms.map(room => ({
      ...room.getSummary(),
      host: {
        id: room.host._id,
        name: room.host.name,
        email: room.host.email
      }
    }));
    
    res.json({
      success: true,
      data: {
        rooms: roomSummaries
      }
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/rooms/:roomId
// @desc    Get room details
// @access  Private
router.get('/:roomId', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
      .populate('host', 'name email')
      .populate('members.userId', 'name email');
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }
    
    // Check if user is member or host
    if (!room.isMember(req.user.id) && !room.isHost(req.user.id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    res.json({
      success: true,
      data: {
        room: {
          ...room.getSummary(),
          host: {
            id: room.host._id,
            name: room.host.name,
            email: room.host.email
          },
          members: room.members.map(member => ({
            id: member.userId._id,
            name: member.userId.name,
            email: member.userId.email,
            joinedAt: member.joinedAt,
            isOnline: member.isOnline,
            lastSeen: member.lastSeen
          }))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/rooms/:roomId/join
// @desc    Join a room
// @access  Private
router.post('/:roomId/join', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }
    
    // Check if room is full
    if (room.members.length >= room.maxMembers) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room is full' 
      });
    }
    
    // Check if user is already a member
    if (room.isMember(req.user.id)) {
      return res.json({
        success: true,
        data: {
          room: room.getSummary(),
          message: 'Already a member'
        }
      });
    }
    
    // Add user to room
    room.addMember(req.user.id, req.user.name);
    await room.save();
    
    res.json({
      success: true,
      data: {
        room: room.getSummary(),
        message: 'Successfully joined room'
      }
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/rooms/:roomId/leave
// @desc    Leave a room
// @access  Private
router.post('/:roomId/leave', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }
    
    // Check if user is a member
    if (!room.isMember(req.user.id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Not a member of this room' 
      });
    }
    
    // Remove user from room
    room.removeMember(req.user.id);
    await room.save();
    
    res.json({
      success: true,
      message: 'Successfully left room'
    });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   DELETE /api/rooms/:roomId
// @desc    Delete a room (host only)
// @access  Private
router.delete('/:roomId', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }
    
    // Check if user is the host
    if (!room.isHost(req.user.id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the host can delete the room' 
      });
    }
    
    await Room.findByIdAndDelete(room._id);
    
    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   PUT /api/rooms/:roomId/settings
// @desc    Update room settings (host only)
// @access  Private
router.put('/:roomId/settings', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Room not found' 
      });
    }
    
    // Check if user is the host
    if (!room.isHost(req.user.id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only the host can update room settings' 
      });
    }
    
    const { name, description, isPrivate, maxMembers, settings } = req.body;
    
    if (name) room.name = name;
    if (description !== undefined) room.description = description;
    if (isPrivate !== undefined) room.isPrivate = isPrivate;
    if (maxMembers) room.maxMembers = maxMembers;
    if (settings) room.settings = { ...room.settings, ...settings };
    
    await room.save();
    
    res.json({
      success: true,
      data: {
        room: room.getSummary()
      }
    });
  } catch (error) {
    console.error('Error updating room settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
