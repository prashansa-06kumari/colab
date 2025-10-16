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

// Import routes
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const boardRoutes = require('./routes/boardRoutes');

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CollabSpace server is running',
    timestamp: new Date().toISOString()
  });
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
io.on('connection', (socket) => {
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
  
  // Broadcast updated user list to all clients
  broadcastOnlineUsers();

  // Join room
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`📝 User ${socket.user.name} joined room: ${roomId}`);
    
    // Get all users currently in the room
    const room = io.sockets.adapter.rooms.get(roomId);
    const usersInRoom = [];
    
    if (room) {
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

  // Handle disconnection
  socket.on('disconnect', () => {
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
