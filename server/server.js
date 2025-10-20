/**
 * CollabSpace Server
 * Main server file with Express, Socket.io, and MongoDB integration
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Import models
const User = require('./models/User');
const Room = require('./models/Room');

// Import routes
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const boardRoutes = require('./routes/boardRoutes');
const aiRoutes = require('./routes/aiRoutes');
const pointsRoutes = require('./routes/pointsRoutes');
const streakRoutes = require('./routes/streakRoutes');
const activityRoutes = require('./routes/activityRoutes');
const historyRoutes = require('./routes/historyRoutes');
const roomRoutes = require('./routes/roomRoutes');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS configuration
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Support large board content
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/board', boardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/rooms', roomRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CollabSpace server is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to add points manually
app.post('/api/test/add-points', async (req, res) => {
  try {
    const { userName, pointsReceived, pointsGiven } = req.body;
    const user = await User.findOne({ name: userName });
    if (user) {
      user.pointsReceived += pointsReceived || 0;
      user.pointsGiven += pointsGiven || 0;
      await user.save();
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error adding test points:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    console.log('🔐 Socket auth - Token provided:', !!token);
    
    if (!token) {
      console.log('❌ Socket auth - No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Socket auth - Token valid for user ID:', decoded.userId);
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('❌ Socket auth - User not found in database');
      return next(new Error('Authentication error: User not found'));
    }

    console.log('✅ Socket auth - User found:', user.name);
    
    // Add user to socket object
    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    console.log('❌ Socket auth - Error:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
});

// Global user tracking
const onlineUsers = new Map(); // userId -> userInfo
const userSockets = new Map(); // userId -> socketId

// Active editors tracking
const activeEditors = new Map(); // roomId -> Set of userIds
const editorCursors = new Map(); // userId -> cursor position

// Helper function to broadcast online users to all clients
const broadcastOnlineUsers = () => {
  const usersList = Array.from(onlineUsers.values());
  console.log('📡 Broadcasting online users to all clients:', usersList.length);
  io.emit('updateOnlineUsers', usersList);
};

// Socket.io connection handling
io.on('connection', async (socket) => {
  console.log(`✅ User connected: ${socket.user.name} (${socket.id})`);

  // Add user to online users list
  const userInfo = {
    userId: socket.userId,
    userName: socket.user.name,
    userEmail: socket.user.email,
    socketId: socket.id,
    connectedAt: new Date().toISOString()
  };
  
  onlineUsers.set(socket.userId, userInfo);
  userSockets.set(socket.userId, socket.id);
  
  console.log(`👥 Added user to online list: ${socket.user.name} (${socket.userId})`);
  console.log(`👥 Total online users: ${onlineUsers.size}`);
  
  // Load user's points from database when they connect
  try {
    console.log(`🔍 Looking for user in database: ${socket.user.name}`);
    const user = await User.findOne({ name: socket.user.name });
    console.log(`🔍 User found in database:`, user ? 'Yes' : 'No');
    if (user) {
      console.log(`🔍 User points in database: received=${user.pointsReceived}, given=${user.pointsGiven}`);
      socket.emit('loadUserPoints', {
        pointsReceived: user.pointsReceived || 0,
        pointsGiven: user.pointsGiven || 0
      });
      console.log(`📊 Loaded points for ${socket.user.name} on connection: received=${user.pointsReceived || 0}, given=${user.pointsGiven || 0}`);
    } else {
      // Send default values if user not found
      console.log(`📊 User ${socket.user.name} not found in database, sending default values`);
      socket.emit('loadUserPoints', {
        pointsReceived: 0,
        pointsGiven: 0
      });
    }
  } catch (error) {
    console.error('❌ Error loading user points on connection:', error);
    // Send default values on error
    socket.emit('loadUserPoints', {
      pointsReceived: 0,
      pointsGiven: 0
    });
  }
  
  // Broadcast updated user list to all clients
  broadcastOnlineUsers();

  // Join room
  socket.on('joinRoom', async (roomId) => {
    socket.join(roomId);
    console.log(`📝 User ${socket.user.name} joined room: ${roomId}`);
    
    // Get all users currently in the room
    const room = io.sockets.adapter.rooms.get(roomId);
    const usersInRoom = [];
    
    if (room) {
      console.log(`📊 Room ${roomId} now has ${room.size} users`);
      for (const socketId of room) {
        const userSocket = io.sockets.sockets.get(socketId);
        if (userSocket && userSocket.user) {
          usersInRoom.push({
            userId: userSocket.userId,
            userName: userSocket.user.name,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    // Send current users list to the newly joined user
    socket.emit('usersInRoom', usersInRoom);
    
            // Load user's points from database
            try {
              const user = await User.findOne({ name: socket.user.name });
              if (user) {
                socket.emit('loadUserPoints', {
                  pointsReceived: user.pointsReceived || 0,
                  pointsGiven: user.pointsGiven || 0
                });
                console.log(`📊 Loaded points for ${socket.user.name}: received=${user.pointsReceived || 0}, given=${user.pointsGiven || 0}`);
              } else {
                // Send default values if user not found
                socket.emit('loadUserPoints', {
                  pointsReceived: 0,
                  pointsGiven: 0
                });
                console.log(`📊 User ${socket.user.name} not found in database, sending default values`);
              }
            } catch (error) {
              console.error('❌ Error loading user points:', error);
              // Send default values on error
              socket.emit('loadUserPoints', {
                pointsReceived: 0,
                pointsGiven: 0
              });
            }
    
    // Notify others in the room about the new user
    socket.to(roomId).emit('userJoined', {
      userId: socket.userId,
      userName: socket.user.name,
      timestamp: new Date().toISOString()
    });
  });

  // Leave room
  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    console.log(`👋 User ${socket.user.name} left room: ${roomId}`);
    
    // Notify others in the room
    socket.to(roomId).emit('userLeft', {
      userId: socket.userId,
      userName: socket.user.name,
      timestamp: new Date().toISOString()
    });
  });

  // Send message
  socket.on('sendMessage', async (data) => {
    try {
      const { roomId, text } = data;
      
      if (!roomId || !text) {
        socket.emit('error', { message: 'Room ID and message text are required' });
        return;
      }

      // Broadcast message to all users in the room
      io.to(roomId).emit('newMessage', {
        id: Date.now().toString(), // Temporary ID for real-time display
        roomId,
        text,
        sender: {
          id: socket.userId,
          name: socket.user.name,
          email: socket.user.email
        },
        timestamp: new Date().toISOString()
      });

      console.log(`💬 Message sent in room ${roomId} by ${socket.user.name}`);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Board content changes
  socket.on('textChange', (data) => {
    const { roomId, content, contentType = 'text' } = data;
    
    // Broadcast text changes to all users in the room except sender
    socket.to(roomId).emit('textChanged', {
      content,
      contentType,
      lastModifiedBy: {
        id: socket.userId,
        name: socket.user.name
      },
      timestamp: new Date().toISOString()
    });

    console.log(`📝 Text changed in room ${roomId} by ${socket.user.name}`);
  });

  // Drawing changes
  socket.on('draw', (data) => {
    const { roomId, drawingData } = data;
    
    // Broadcast drawing changes to all users in the room except sender
    socket.to(roomId).emit('drawingChanged', {
      drawingData,
      lastModifiedBy: {
        id: socket.userId,
        name: socket.user.name
      },
      timestamp: new Date().toISOString()
    });

    console.log(`🎨 Drawing updated in room ${roomId} by ${socket.user.name}`);
  });

  // Drawing stroke events (for real-time drawing)
  socket.on('drawing', (data) => {
    console.log('🎨 Server received drawing data:', data);
    const { roomId, stroke, color, size } = data;
    
    // Get all sockets in the room
    const room = io.sockets.adapter.rooms.get(roomId);
    console.log(`📊 Room ${roomId} has ${room ? room.size : 0} users`);
    
    const drawingData = {
      roomId,
      stroke,
      color,
      size,
      drawnBy: {
        id: socket.userId,
        name: socket.user.name
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Server broadcasting drawing to room:', roomId);
    console.log('📤 Drawing data:', drawingData);
    
    // Broadcast stroke to all users in the room except sender
    socket.to(roomId).emit('drawing', drawingData);
    
    // Also broadcast to the room using io.to() to ensure all users get it
    io.to(roomId).emit('drawing', drawingData);
    
    // Log the broadcast
    console.log(`📤 Broadcasted drawing to room ${roomId} with ${room ? room.size : 0} users`);

    console.log(`🎨 Stroke drawn in room ${roomId} by ${socket.user.name}`);
  });

  // Clear canvas event
  socket.on('clearCanvas', (data) => {
    const { roomId } = data;
    
    // Broadcast clear canvas to all users in the room except sender
    socket.to(roomId).emit('clearCanvas', {
      roomId,
      clearedBy: {
        id: socket.userId,
        name: socket.user.name
      },
      timestamp: new Date().toISOString()
    });

    console.log(`🧹 Canvas cleared in room ${roomId} by ${socket.user.name}`);
  });

  // Test event for debugging
  socket.on('test', (data) => {
    console.log('🧪 Server received test event:', data);
    socket.emit('testResponse', { 
      message: 'Hello from server', 
      received: data,
      timestamp: new Date().toISOString()
    });
  });

  // Test broadcast event
  socket.on('testBroadcast', (data) => {
    console.log('📡 Server received broadcast test:', data);
    const { roomId, message, timestamp } = data;
    
    // Broadcast to all users in the room
    io.to(roomId).emit('broadcastTest', {
      message: `Broadcast from ${socket.user.name}: ${message}`,
      from: socket.user.name,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📡 Broadcasted test message to room ${roomId}`);
  });

  // Points system events
  socket.on('givePoints', async (data) => {
    console.log('⭐ Server received points:', data);
    const { roomId, points, targetUser, fromUser } = data;
    
    console.log('🔍 Server checking self-point prevention:', {
      targetUser,
      currentUser: socket.user.name,
      isSelf: targetUser === socket.user.name,
      userId: socket.userId,
      targetUserId: data.targetUserId
    });
    
    // Multiple checks to prevent self-point giving
    const isSelfPoint = targetUser === socket.user.name || 
                       targetUser === 'You' || 
                       targetUser === socket.userId ||
                       (data.targetUserId && data.targetUserId === socket.userId);
    
    if (isSelfPoint) {
      console.log(`❌ ${socket.user.name} tried to give points to themselves - blocked`);
      socket.emit('pointsError', {
        message: 'You cannot give points to yourself!',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Additional validation: check if target user exists in the room
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room || room.size < 2) {
      console.log(`❌ Invalid room or not enough users in room ${roomId}`);
      socket.emit('pointsError', {
        message: 'Invalid target user or room!',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    try {
      // Find users by name to get their IDs
      const fromUserDoc = await User.findOne({ name: socket.user.name });
      const toUserDoc = await User.findOne({ name: targetUser });
      
      if (!fromUserDoc || !toUserDoc) {
        console.log('❌ User not found in database');
        socket.emit('pointsError', {
          message: 'User not found!',
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      const pointsToGive = parseInt(points);
      
      // Update points in database using atomic operations and get updated values
      const [updatedReceiver, updatedSender] = await Promise.all([
        User.findByIdAndUpdate(
          toUserDoc._id, 
          { $inc: { pointsReceived: pointsToGive } },
          { new: true }
        ),
        User.findByIdAndUpdate(
          fromUserDoc._id, 
          { $inc: { pointsGiven: pointsToGive } },
          { new: true }
        )
      ]);
      
      console.log(`✅ Points saved to database: ${pointsToGive} from ${socket.user.name} to ${targetUser}`);
      console.log(`📊 Updated totals - ${socket.user.name}: given=${updatedSender.pointsGiven}, ${targetUser}: received=${updatedReceiver.pointsReceived}`);
      
      // Send updated points to the sender immediately
      socket.emit('loadUserPoints', {
        pointsReceived: updatedSender.pointsReceived,
        pointsGiven: updatedSender.pointsGiven
      });
      
      // Send updated points to the receiver (if they're in the room)
      const receiverSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.user && s.user.name === targetUser);
      
      if (receiverSocket) {
        receiverSocket.emit('loadUserPoints', {
          pointsReceived: updatedReceiver.pointsReceived,
          pointsGiven: updatedReceiver.pointsGiven
        });
        console.log(`📊 Sent updated points to receiver: ${targetUser}`);
      }
      
      // Broadcast points event to all users in the room
      io.to(roomId).emit('pointsReceived', {
        points: pointsToGive,
        fromUser: socket.user.name,
        targetUser,
        timestamp: new Date().toISOString()
      });
      
      // Broadcast points given update to all users in the room
      io.to(roomId).emit('pointsGivenUpdate', {
        fromUser: socket.user.name,
        pointsGiven: pointsToGive,
        timestamp: new Date().toISOString()
      });
      
      console.log(`⭐ ${socket.user.name} gave ${points} points to ${targetUser} in room ${roomId}`);
    } catch (error) {
      console.error('❌ Error saving points to database:', error);
      socket.emit('pointsError', {
        message: 'Error saving points to database!',
        timestamp: new Date().toISOString()
      });
    }
  });

          // Drawing notifications
          socket.on('userStartedDrawing', (data) => {
            console.log('🎨 User started drawing:', data);
            const { roomId, userName } = data;
            
            // Broadcast drawing notification to other users in the room
            socket.to(roomId).emit('userStartedDrawing', {
              roomId,
              userName: socket.user.name,
              timestamp: new Date().toISOString()
            });
            
            console.log(`🎨 ${socket.user.name} started drawing in room ${roomId}`);
          });

          // Request user points
          socket.on('requestUserPoints', async (data) => {
            console.log('📊 User requested points:', data);
            try {
              console.log(`🔍 Looking for user in database: ${data.userName}`);
              const user = await User.findOne({ name: data.userName });
              console.log(`🔍 User found in database:`, user ? 'Yes' : 'No');
              if (user) {
                console.log(`🔍 User points in database: received=${user.pointsReceived}, given=${user.pointsGiven}`);
                socket.emit('loadUserPoints', {
                  pointsReceived: user.pointsReceived || 0,
                  pointsGiven: user.pointsGiven || 0
                });
                console.log(`📊 Sent points to ${data.userName}: received=${user.pointsReceived || 0}, given=${user.pointsGiven || 0}`);
              } else {
                console.log(`❌ User not found: ${data.userName}`);
                // Send default values if user not found
                socket.emit('loadUserPoints', {
                  pointsReceived: 0,
                  pointsGiven: 0
                });
              }
            } catch (error) {
              console.error('❌ Error loading user points:', error);
              // Send default values on error
              socket.emit('loadUserPoints', {
                pointsReceived: 0,
                pointsGiven: 0
              });
            }
          });

  // Drawing cursor movement
  socket.on('drawingCursorMove', (data) => {
    const { roomId, x, y, color, username } = data;
    
    // Broadcast cursor position to other users in the room
    socket.to(roomId).emit('userCursorMove', {
      roomId,
      userId: socket.userId,
      x,
      y,
      color,
      username: socket.user.name,
      timestamp: new Date().toISOString()
    });
  });

  // Cursor position tracking
  socket.on('cursorMove', (data) => {
    const { roomId, position } = data;
    
    // Broadcast cursor position to other users in the room
    socket.to(roomId).emit('userCursorMove', {
      userId: socket.userId,
      userName: socket.user.name,
      position,
      timestamp: new Date().toISOString()
    });
  });

  // User typing indicator
  socket.on('typing', (data) => {
    const { roomId, isTyping } = data;
    
    // Broadcast typing status to other users in the room
    socket.to(roomId).emit('userTyping', {
      userId: socket.userId,
      userName: socket.user.name,
      isTyping,
      timestamp: new Date().toISOString()
    });
  });

  // User started editing
  socket.on('startEditing', (data) => {
    const { roomId } = data;
    
    // Add user to active editors for this room
    if (!activeEditors.has(roomId)) {
      activeEditors.set(roomId, new Set());
    }
    activeEditors.get(roomId).add(socket.userId);
    
    // Broadcast to other users in the room
    socket.to(roomId).emit('userStartedEditing', {
      userId: socket.userId,
      userName: socket.user.name,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✏️ User ${socket.user.name} started editing in room ${roomId}`);
  });

  // User stopped editing
  socket.on('stopEditing', (data) => {
    const { roomId } = data;
    
    // Remove user from active editors
    if (activeEditors.has(roomId)) {
      activeEditors.get(roomId).delete(socket.userId);
    }
    
    // Broadcast to other users in the room
    socket.to(roomId).emit('userStoppedEditing', {
      userId: socket.userId,
      userName: socket.user.name,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✏️ User ${socket.user.name} stopped editing in room ${roomId}`);
  });

  // Cursor position tracking
  socket.on('cursorMove', (data) => {
    const { roomId, position } = data;
    
    // Store cursor position
    editorCursors.set(socket.userId, {
      position,
      timestamp: new Date().toISOString()
    });
    
    // Broadcast cursor position to other users in the room
    socket.to(roomId).emit('userCursorMove', {
      userId: socket.userId,
      userName: socket.user.name,
      position,
      timestamp: new Date().toISOString()
    });
  });

  // Get active editors for a room
  socket.on('getActiveEditors', (data) => {
    const { roomId } = data;
    
    const editors = activeEditors.get(roomId) || new Set();
    const editorsList = Array.from(editors).map(userId => {
      const user = onlineUsers.get(userId);
      const cursor = editorCursors.get(userId);
      return {
        userId,
        userName: user?.userName,
        userEmail: user?.userEmail,
        cursor: cursor?.position,
        lastSeen: cursor?.timestamp
      };
    });
    
    socket.emit('activeEditors', {
      roomId,
      editors: editorsList,
      timestamp: new Date().toISOString()
    });
  });

  // Room Management Events
  socket.on('joinRoomById', async (roomId) => {
    try {
      console.log(`🏠 User ${socket.user.name} attempting to join room: ${roomId}`);
      
      // Find room in database
      const room = await Room.findOne({ roomId });
      if (!room) {
        socket.emit('roomError', { message: 'Room not found' });
        return;
      }
      
      // Check if user is a member
      if (!room.isMember(socket.userId)) {
        socket.emit('roomError', { message: 'Access denied. You are not a member of this room.' });
        return;
      }
      
      // Join Socket.io room
      socket.join(roomId);
      
      // Update user's online status in database
      room.addMember(socket.userId, socket.user.name);
      await room.save();
      
      // Get all users currently in the room
      const roomSockets = await io.in(roomId).fetchSockets();
      const usersInRoom = roomSockets.map(s => ({
        userId: s.userId,
        userName: s.user.name,
        userEmail: s.user.email,
        socketId: s.id,
        connectedAt: new Date().toISOString()
      }));
      
      // Notify all users in the room about the new user
      socket.to(roomId).emit('userJoinedRoom', {
        userId: socket.userId,
        userName: socket.user.name,
        userEmail: socket.user.email,
        timestamp: new Date().toISOString()
      });
      
      // Send current room members to the newly joined user
      socket.emit('roomMembers', {
        roomId,
        members: room.members.map(member => ({
          userId: member.userId,
          userName: member.userId.name || member.username,
          isOnline: member.isOnline,
          lastSeen: member.lastSeen
        }))
      });
      
      console.log(`✅ User ${socket.user.name} successfully joined room: ${roomId}`);
      
    } catch (error) {
      console.error('❌ Error joining room:', error);
      socket.emit('roomError', { message: 'Failed to join room' });
    }
  });
  
  socket.on('leaveRoomById', async (roomId) => {
    try {
      console.log(`🏠 User ${socket.user.name} leaving room: ${roomId}`);
      
      // Leave Socket.io room
      socket.leave(roomId);
      
      // Update user's offline status in database
      const room = await Room.findOne({ roomId });
      if (room) {
        room.removeMember(socket.userId);
        await room.save();
        
        // Notify other users in the room
        socket.to(roomId).emit('userLeftRoom', {
          userId: socket.userId,
          userName: socket.user.name,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log(`✅ User ${socket.user.name} left room: ${roomId}`);
      
    } catch (error) {
      console.error('❌ Error leaving room:', error);
    }
  });
  
  socket.on('getRoomMembers', async (roomId) => {
    try {
      const room = await Room.findOne({ roomId }).populate('members.userId', 'name email');
      if (!room) {
        socket.emit('roomError', { message: 'Room not found' });
        return;
      }
      
      // Check if user is a member
      if (!room.isMember(socket.userId)) {
        socket.emit('roomError', { message: 'Access denied' });
        return;
      }
      
      socket.emit('roomMembers', {
        roomId,
        members: room.members.map(member => ({
          userId: member.userId._id,
          userName: member.userId.name,
          userEmail: member.userId.email,
          isOnline: member.isOnline,
          lastSeen: member.lastSeen,
          joinedAt: member.joinedAt
        }))
      });
      
    } catch (error) {
      console.error('❌ Error getting room members:', error);
      socket.emit('roomError', { message: 'Failed to get room members' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`❌ User disconnected: ${socket.user.name} (${socket.id})`);
    
    // Remove user from online users list
    if (onlineUsers.has(socket.userId)) {
      onlineUsers.delete(socket.userId);
      userSockets.delete(socket.userId);
      
      console.log(`👥 Removed user from online list: ${socket.user.name} (${socket.userId})`);
      console.log(`👥 Total online users: ${onlineUsers.size}`);
      
      // Broadcast updated user list to all remaining clients
      broadcastOnlineUsers();
    }
    
    // Update user's offline status in all rooms
    try {
      const rooms = await Room.find({ 'members.userId': socket.userId });
      for (const room of rooms) {
        room.removeMember(socket.userId);
        await room.save();
        
        // Notify other users in the room
        socket.to(room.roomId).emit('userLeftRoom', {
          userId: socket.userId,
          userName: socket.user.name,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Error updating room status on disconnect:', error);
    }

    // Clean up editor tracking
    editorCursors.delete(socket.userId);
    
    // Remove user from all active editors
    for (const [roomId, editors] of activeEditors.entries()) {
      if (editors.has(socket.userId)) {
        editors.delete(socket.userId);
        
        // Broadcast that user stopped editing
        io.to(roomId).emit('userStoppedEditing', {
          userId: socket.userId,
          userName: socket.user.name,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Broadcast user disconnection for drawing cursors
    socket.broadcast.emit('userDisconnected', {
      userId: socket.userId,
      userName: socket.user.name,
      timestamp: new Date().toISOString()
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 CollabSpace server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for real-time connections`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
});
