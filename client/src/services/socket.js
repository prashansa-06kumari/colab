/**
 * Socket Service
 * Handles real-time communication with the backend
 */

import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.roomId = null;
  }

  /**
   * Connect to the Socket.io server
   * @param {string} token - JWT authentication token
   */
  connect(token) {
    if (this.socket && this.connected) {
      return this.socket;
    }

    console.log('🔌 Socket - Connecting to server with token:', !!token);
    this.socket = io('http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('✅ Socket connected to server');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected from server');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.connected = false;
    });

    return this.socket;
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Join a room
   * @param {string} roomId - Room identifier
   */
  joinRoom(roomId) {
    if (this.socket && this.connected) {
      this.roomId = roomId;
      console.log('🔌 Socket - Joining room:', roomId);
      this.socket.emit('joinRoom', roomId);
    } else {
      console.log('🔌 Socket - Cannot join room, socket not connected:', {
        hasSocket: !!this.socket,
        connected: this.connected
      });
    }
  }

  /**
   * Leave current room
   */
  leaveRoom() {
    if (this.socket && this.connected && this.roomId) {
      this.socket.emit('leaveRoom', this.roomId);
      this.roomId = null;
    }
  }

  /**
   * Send a message to the current room
   * @param {string} text - Message content
   */
  sendMessage(text) {
    if (this.socket && this.connected && this.roomId) {
      this.socket.emit('sendMessage', {
        roomId: this.roomId,
        text: text
      });
    }
  }

  /**
   * Send text changes to the board
   * @param {string} content - Updated text content
   * @param {string} contentType - Type of content (text, drawing, etc.)
   */
  sendTextChange(content, contentType = 'text') {
    if (this.socket && this.connected && this.roomId) {
      this.socket.emit('textChange', {
        roomId: this.roomId,
        content: content,
        contentType: contentType
      });
    }
  }

  /**
   * Send drawing changes to the board
   * @param {Object} drawingData - Drawing data
   */
  sendDrawing(drawingData) {
    if (this.socket && this.connected && this.roomId) {
      this.socket.emit('draw', {
        roomId: this.roomId,
        drawingData: drawingData
      });
    }
  }

  /**
   * Send cursor position
   * @param {Object} position - Cursor coordinates
   */
  sendCursorMove(position) {
    if (this.socket && this.connected && this.roomId) {
      this.socket.emit('cursorMove', {
        roomId: this.roomId,
        position: position
      });
    }
  }

  /**
   * Send typing indicator
   * @param {boolean} isTyping - Whether user is typing
   */
  sendTyping(isTyping) {
    if (this.socket && this.connected && this.roomId) {
      this.socket.emit('typing', {
        roomId: this.roomId,
        isTyping: isTyping
      });
    }
  }

  /**
   * Listen for new messages
   * @param {Function} callback - Callback function for new messages
   */
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('newMessage', callback);
    }
  }

  /**
   * Listen for text changes
   * @param {Function} callback - Callback function for text changes
   */
  onTextChanged(callback) {
    if (this.socket) {
      this.socket.on('textChanged', callback);
    }
  }

  /**
   * Listen for drawing changes
   * @param {Function} callback - Callback function for drawing changes
   */
  onDrawingChanged(callback) {
    if (this.socket) {
      this.socket.on('drawingChanged', callback);
    }
  }

  /**
   * Listen for user cursor movements
   * @param {Function} callback - Callback function for cursor movements
   */
  onUserCursorMove(callback) {
    if (this.socket) {
      this.socket.on('userCursorMove', callback);
    }
  }

  /**
   * Listen for user typing indicators
   * @param {Function} callback - Callback function for typing indicators
   */
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('userTyping', callback);
    }
  }

  /**
   * Listen for user joining room
   * @param {Function} callback - Callback function for user join events
   */
  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('userJoined', (userData) => {
        console.log('🔌 Socket - Received userJoined:', userData);
        callback(userData);
      });
    }
  }

  /**
   * Listen for user leaving room
   * @param {Function} callback - Callback function for user leave events
   */
  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on('userLeft', callback);
    }
  }

  /**
   * Listen for users currently in room
   * @param {Function} callback - Callback function for users in room
   */
  onUsersInRoom(callback) {
    if (this.socket) {
      this.socket.on('usersInRoom', (users) => {
        console.log('🔌 Socket - Received usersInRoom:', users);
        callback(users);
      });
    }
  }

  /**
   * Listen for global online users updates
   * @param {Function} callback - Callback function for online users updates
   */
  onUpdateOnlineUsers(callback) {
    if (this.socket) {
      this.socket.on('updateOnlineUsers', (users) => {
        console.log('🔌 Socket - Received updateOnlineUsers:', users);
        callback(users);
      });
    }
  }

  /**
   * Listen for errors
   * @param {Function} callback - Callback function for errors
   */
  onError(callback) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  /**
   * Listen for active editors updates
   * @param {Function} callback - Callback function for active editors
   */
  onActiveEditors(callback) {
    if (this.socket) {
      this.socket.on('activeEditors', callback);
    }
  }

  /**
   * Listen for user started editing
   * @param {Function} callback - Callback function for user started editing
   */
  onUserStartedEditing(callback) {
    if (this.socket) {
      this.socket.on('userStartedEditing', callback);
    }
  }

  /**
   * Listen for user stopped editing
   * @param {Function} callback - Callback function for user stopped editing
   */
  onUserStoppedEditing(callback) {
    if (this.socket) {
      this.socket.on('userStoppedEditing', callback);
    }
  }

  /**
   * Emit socket events
   */
  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

// Create and export a singleton instance
const socketService = new SocketService();
export default socketService;
