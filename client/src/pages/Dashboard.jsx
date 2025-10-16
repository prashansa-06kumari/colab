/**
 * Dashboard Page Component
 * Main collaborative workspace with chat and board
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ChatBox from '../components/ChatBox';
import MessageInput from '../components/MessageInput';
import UserList from '../components/UserList';
import Board from '../components/Board';
import EditMessageModal from '../components/EditMessageModal';
import socketService from '../services/socket';
import { messagesAPI, boardAPI } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [roomId, setRoomId] = useState('default-room'); // Default room for demo
  const [connectedUsers, setConnectedUsers] = useState([]);
  
  // Debug connected users
  useEffect(() => {
    console.log('👥 Connected users updated:', connectedUsers);
  }, [connectedUsers]);
  const [messages, setMessages] = useState([]);
  const [boardContent, setBoardContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  /**
   * Initialize socket connection and room
   */
  useEffect(() => {
    if (user) {
      console.log('🚀 Initializing socket connection for user:', user.name);
      
      // Load existing data
      loadExistingData();
      
      // Set up socket event listeners first
      setupSocketListeners();

      // Join the room
      console.log('🚀 Joining room:', roomId);
      socketService.joinRoom(roomId);

      // Cleanup on unmount
      return () => {
        console.log('🚀 Cleaning up socket connection');
        socketService.leaveRoom();
        socketService.removeAllListeners();
      };
    }
  }, [user, roomId]);

  /**
   * Load existing messages and board content
   */
  const loadExistingData = async () => {
    try {
      // Debug user data
      console.log('👤 Current user data:', user);
      
      // Load messages
      const messagesResponse = await messagesAPI.getMessages(roomId);
      if (messagesResponse.success) {
        const loadedMessages = messagesResponse.data.messages || [];
        
        // Debug the raw message structure
        console.log('🔍 Raw message from database:', loadedMessages[0]);
        
        // Transform messages to match frontend format
        const transformedMessages = loadedMessages.map(msg => {
          console.log('🔍 Processing message:', {
            id: msg._id,
            senderId: msg.senderId,
            hasName: !!msg.senderId?.name
          });
          
          return {
            id: msg._id,
            _id: msg._id, // Keep both for compatibility
            roomId: msg.roomId,
            text: msg.text,
            timestamp: msg.timestamp,
            sender: {
              id: msg.senderId?._id || msg.senderId,
              name: msg.senderId?.name || 'Unknown User',
              email: msg.senderId?.email || ''
            }
          };
        });
        
        setMessages(transformedMessages);
        console.log(`📥 Loaded ${transformedMessages.length} messages from database`);
        console.log('📝 Sample message:', transformedMessages[0]);
      }

      // Load board content
      const boardResponse = await boardAPI.getBoard(roomId);
      if (boardResponse.success) {
        const boardData = boardResponse.data.board.content || '';
        setBoardContent(boardData);
        console.log(`📄 Loaded board content: ${boardData.length} characters`);
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    }
  };

  /**
   * Set up socket event listeners
   */
  const setupSocketListeners = () => {
    // Listen for new messages from other users
    socketService.onNewMessage((message) => {
      // Only add if it's not from the current user (to avoid duplicates)
      const currentUserId = user._id || user.id;
      if (message.sender?.id !== currentUserId) {
        setMessages(prev => [...prev, message]);
      }
    });

    // Listen for text changes
    socketService.onTextChanged((data) => {
      setBoardContent(data.content);
    });

    // Listen for global online users updates
    socketService.onUpdateOnlineUsers((users) => {
      console.log('👥 Received global online users update:', users);
      console.log('👥 Users array length:', users.length);
      console.log('👥 Users details:', users);
      setConnectedUsers(users);
    });

    // Fallback: Add only current user if no users are received
    setTimeout(() => {
      if (connectedUsers.length === 0) {
        console.log('🔄 Fallback: Adding current user to list');
        const currentUser = {
          userId: user._id || user.id,
          userName: user.name,
          userEmail: user.email,
          connectedAt: new Date().toISOString()
        };
        setConnectedUsers([currentUser]);
      }
    }, 3000); // Wait 3 seconds, then add current user if no users received

    // Listen for users currently in room (when joining) - keep for room-specific features
    socketService.onUsersInRoom((users) => {
      console.log('👥 Received users in room:', users);
    });

    // Listen for user joining - keep for room-specific features
    socketService.onUserJoined((userData) => {
      console.log('👤 User joined room:', userData);
    });

    // Listen for user leaving - keep for room-specific features
    socketService.onUserLeft((userData) => {
      console.log('👋 User left room:', userData);
    });

    // Listen for errors
    socketService.onError((error) => {
      console.error('Socket error:', error);
    });
  };

  /**
   * Handle sending a message
   */
  const handleSendMessage = async (text) => {
    if (text.trim()) {
      // Add message to local state immediately for instant display
      const newMessage = {
        id: Date.now().toString(),
        roomId: roomId,
        text: text,
        sender: {
          id: user._id || user.id,
          name: user.name,
          email: user.email
        },
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      try {
        // Save message to database
        console.log('💾 Saving message to database:', { roomId, text, userId: user._id || user.id });
        await messagesAPI.createMessage({
          roomId: roomId,
          text: text
        });
        
        console.log('✅ Message saved successfully');
        
        // Send via socket for real-time updates
        socketService.sendMessage(text);
      } catch (error) {
        console.error('❌ Failed to save message:', error);
        // Remove the message from local state if save failed
        setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
        alert('Failed to send message. Please try again.');
      }
    }
  };

  /**
   * Handle board content changes
   */
  const handleBoardChange = (content) => {
    setBoardContent(content);
    socketService.sendTextChange(content);
  };

  /**
   * Save all data (messages and board content)
   */
  const saveAllData = async () => {
    setIsSaving(true);
    try {
      // Save board content
      await boardAPI.updateBoard(roomId, {
        content: boardContent,
        contentType: 'text'
      });

      // Messages are already saved when sent, but we can verify they exist
      console.log(`📝 ${messages.length} messages in current session`);
      console.log(`📄 Board content length: ${boardContent.length} characters`);

      setLastSaved(new Date().toLocaleTimeString());
      console.log('✅ All data saved successfully');
    } catch (error) {
      console.error('❌ Error saving data:', error);
      alert('Failed to save data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Auto-save board content (debounced)
   */
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (boardContent && boardContent.trim()) {
        boardAPI.updateBoard(roomId, {
          content: boardContent,
          contentType: 'text'
        }).catch(error => {
          console.error('Auto-save failed:', error);
        });
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [boardContent, roomId]);

  /**
   * Handle edit message
   */
  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setIsEditModalOpen(true);
  };

  /**
   * Handle save edited message
   */
  const handleSaveEditedMessage = async (messageId, newText) => {
    console.log('🔧 Edit message called:', { messageId, newText });
    
    try {
      // Update message in local state immediately for instant feedback
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, text: newText }
          : msg
      ));

      console.log('📝 Calling API to update message...');
      console.log('📝 Using messageId:', messageId);
      console.log('📝 MessageId type:', typeof messageId);
      console.log('📝 New text:', newText);
      
      // Test the API call first
      try {
        const response = await messagesAPI.updateMessage(messageId, newText);
        console.log('📝 API response:', response);
      } catch (apiError) {
        console.error('📝 API Error details:', {
          message: apiError.message,
          response: apiError.response?.data,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText
        });
        throw apiError;
      }
      
      console.log('✅ Message updated successfully:', { messageId, newText });
      setLastSaved(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Failed to update message:', error);
      console.error('❌ Error details:', error.response?.data);
      // Revert the local change if API failed
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, text: editingMessage?.text || msg.text }
          : msg
      ));
      alert(`Failed to update message: ${error.response?.data?.message || error.message}`);
    }
  };

  /**
   * Handle delete message
   */
  const handleDeleteMessage = async (messageId) => {
    console.log('🗑️ Delete message called:', { messageId });
    
    try {
      // Remove message from local state immediately for instant feedback
      setMessages(prev => prev.filter(msg => msg.id !== messageId));

      console.log('🗑️ Calling API to delete message...');
      const response = await messagesAPI.deleteMessage(messageId);
      console.log('🗑️ API response:', response);
      
      console.log('🗑️ Message deleted successfully:', messageId);
    } catch (error) {
      console.error('❌ Failed to delete message:', error);
      console.error('❌ Error details:', error.response?.data);
      alert(`Failed to delete message: ${error.response?.data?.message || error.message}`);
    }
  };

  /**
   * Handle close edit modal
   */
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar 
        onSave={saveAllData}
        isSaving={isSaving}
        lastSaved={lastSaved}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Side - Chat Section */}
          <div className="flex flex-col">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 h-[600px] flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Chat Room
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {connectedUsers.length} user{connectedUsers.length !== 1 ? 's' : ''} online
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={loadExistingData}
                      className="px-4 py-2 bg-white/60 hover:bg-white/80 text-gray-700 text-sm font-medium rounded-xl border border-gray-200 transition-all duration-300 ease-in-out hover:shadow-md"
                    >
                      🔄 Refresh
                    </button>
                    <button
                      onClick={saveAllData}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-xl transition-all duration-300 ease-in-out hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Saving...' : '💾 Save'}
                    </button>
                  </div>
                </div>
                {lastSaved && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Last saved: {lastSaved}
                  </div>
                )}
              </div>

              {/* Chat Messages - Fixed height with internal scrolling */}
              <div className="flex-1 overflow-y-auto bg-gray-50/50">
                <ChatBox 
                  messages={messages}
                  currentUserId={user._id || user.id}
                  onEditMessage={handleEditMessage}
                  onDeleteMessage={handleDeleteMessage}
                />
              </div>

              {/* Message Input - Fixed at bottom */}
              <div className="border-t border-gray-100 bg-white/80 backdrop-blur-sm p-4">
                <MessageInput onSendMessage={handleSendMessage} />
              </div>
            </div>
          </div>

          {/* Right Side - Collaboration Board */}
          <div className="flex flex-col">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 h-[600px] flex flex-col overflow-hidden">
              {/* Board Header */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      Collaborative Board
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Real-time text editing and drawing
                    </p>
                  </div>
                  <button
                    onClick={saveAllData}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-medium rounded-xl transition-all duration-300 ease-in-out hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : '💾 Save Board'}
                  </button>
                </div>
              </div>

              {/* Board Content - Fixed height with internal scrolling */}
              <div className="flex-1 overflow-hidden bg-gray-50/30">
                <Board 
                  content={boardContent}
                  onChange={handleBoardChange}
                  roomId={roomId}
                />
              </div>
            </div>
          </div>
        </div>

        {/* User List - Modern floating design */}
        <div className="fixed right-6 top-24 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-6 w-72 z-20 max-h-80 overflow-y-auto">
          <UserList users={connectedUsers} />
        </div>
      </div>

      {/* Edit Message Modal */}
      <EditMessageModal
        message={editingMessage}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveEditedMessage}
      />
    </div>
  );
};

export default Dashboard;
