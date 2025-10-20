/**
 * Dashboard Page Component
 * Main collaborative workspace with chat and board
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Save, Edit3, Palette, Users, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ChatBox from '../components/ChatBox';
import MessageInput from '../components/MessageInput';
import Board from '../components/Board';
import DrawingBoard from '../components/DrawingBoard';
import EditMessageModal from '../components/EditMessageModal';
import ActivityCalendar from '../components/ActivityCalendar';
import StreakCounter from '../components/StreakCounter';
import Notification from '../components/Notification';
import socketService from '../services/socket';
import streakService from '../services/streakService';
import activityService from '../services/activityService';
import historyService from '../services/historyService';
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
  const [activeTab, setActiveTab] = useState('text'); // 'text' or 'drawing'
  const [showStreak, setShowStreak] = useState(false); // Show streak components
  const [notification, setNotification] = useState(null); // Notification state
  const [lastEditActivity, setLastEditActivity] = useState(null); // Track last edit activity
  const [loginRecorded, setLoginRecorded] = useState(false); // Track if login has been recorded
  const [lastTextChange, setLastTextChange] = useState(null); // Track last text change for history
  const [logoutRecorded, setLogoutRecorded] = useState(false); // Track if logout has been recorded
  const [sessionId, setSessionId] = useState(null); // Track current session

  /**
   * Show notification
   */
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };


  /**
   * Initialize socket connection and room
   */
  useEffect(() => {
    if (user) {
      console.log('🚀 Initializing socket connection for user:', user.name);
      
      // Initialize activity service
      activityService.initialize(user.id);
      
      // Initialize history service
      historyService.initialize(user.id);
      
      // Listen for user switching events
      const handleUserSwitch = () => {
        console.log('🔄 Dashboard - User switched, reinitializing services');
        
        // Reinitialize services with new user
        if (socketService.user?.id) {
          activityService.initialize(socketService.user.id);
          historyService.initialize(socketService.user.id);
          console.log('🔄 Dashboard - Services reinitialized for new user:', socketService.user.id);
        }
      };
      
      window.addEventListener('userSwitched', handleUserSwitch);
      
      // Generate new session ID
      const newSessionId = Date.now().toString();
      setSessionId(newSessionId);
      
      // Reset states for new session
      setLoginRecorded(false);
      setLogoutRecorded(false);
      
      // Record login activity for this new session
      activityService.recordActivity('login', 'User logged in');
      setLoginRecorded(true);
      console.log('🔑 Login activity recorded for session:', newSessionId);
      
      // Track login activity for streak
      streakService.trackLogin().then((result) => {
        console.log('🔥 Streak tracking result:', result);
        if (result && result.success) {
          if (result.isNewStreakDay) {
            showNotification(`Day ${result.currentStreak} Streak! 🔥`, 'success');
          }
          // Trigger refresh of streak components
          window.dispatchEvent(new CustomEvent('streakUpdated'));
        }
      }).catch((error) => {
        console.error('Failed to track login activity:', error);
      });
      
      // Load existing data
      loadExistingData();
      
      // Set up socket event listeners first
      setupSocketListeners();

      // Join the room
      console.log('🚀 Joining room:', roomId);
      socketService.joinRoom(roomId);

      // Add beforeunload listener for logout tracking
      const handleBeforeUnload = () => {
        if (!logoutRecorded) {
          activityService.recordActivity('logout', 'User logged out');
          console.log('🔑 Logout activity recorded on page unload for session:', sessionId);
        }
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // Cleanup on unmount
      return () => {
        console.log('🚀 Cleaning up socket connection');
        
        // Record logout activity only once per session
        if (!logoutRecorded && sessionId) {
          activityService.recordActivity('logout', 'User logged out');
          setLogoutRecorded(true);
          console.log('🔑 Logout activity recorded for session:', sessionId);
        }
        
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('userSwitched', handleUserSwitch);
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
      // Track message activity for streak
      streakService.trackMessage(text);
      
      // Record message activity
      activityService.recordActivity('message', `Sent message: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      
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
    
    // Track edit activity for streak
    streakService.trackEdit('text');
    
    // Record text change in history with debouncing (only if content has changed significantly)
    const now = Date.now();
    const shouldRecordHistory = !lastTextChange || 
                               content !== lastTextChange.content || 
                               (now - lastTextChange.timestamp > 5000); // 5 seconds between history entries
    
    if (shouldRecordHistory) {
      historyService.addTextChange(content, 'edit');
      setLastTextChange({ content, timestamp: now });
    }
    
    // Only record edit activity if content is substantial and enough time has passed
    const shouldRecordEdit = content.length > 20 && 
                            content.trim().length > 10 && 
                            (!lastEditActivity || now - lastEditActivity > 30000); // 30 seconds between edit activities
    
    if (shouldRecordEdit) {
      activityService.recordActivity('edit', `Edited board content (${content.length} characters)`);
      setLastEditActivity(now);
    }
    
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      
      <Navbar 
        onSave={saveAllData}
        isSaving={isSaving}
        lastSaved={lastSaved}
        connectedUsers={connectedUsers}
        showStreak={showStreak}
        onToggleStreak={() => setShowStreak(!showStreak)}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Streak Components */}
        {showStreak && (
          <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StreakCounter />
            <ActivityCalendar />
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Side - Chat Section */}
          <div className="flex flex-col">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl h-[600px] flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      Chat Room
                    </h2>
                    <p className="text-sm text-slate-300 mt-1">
                      {connectedUsers.length} user{connectedUsers.length !== 1 ? 's' : ''} online
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={loadExistingData}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all duration-200 border border-purple-500/50 text-sm"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Refresh
                    </button>
                    <button
                      onClick={saveAllData}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {lastSaved && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                    Last saved: {lastSaved}
                  </div>
                )}
              </div>

              {/* Chat Messages - Fixed height with internal scrolling */}
              <div className="flex-1 overflow-y-auto bg-slate-800/30">
                <ChatBox 
                  messages={messages}
                  currentUserId={user._id || user.id}
                  onEditMessage={handleEditMessage}
                  onDeleteMessage={handleDeleteMessage}
                />
              </div>

              {/* Message Input - Fixed at bottom */}
              <div className="border-t border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-4">
                <MessageInput onSendMessage={handleSendMessage} />
              </div>
            </div>
          </div>

          {/* Right Side - Collaboration Workspace */}
          <div className="flex flex-col">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl h-[600px] flex flex-col overflow-hidden">
              {/* Workspace Header with Tabs */}
              <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-purple-600/20 to-pink-600/20">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      Collaboration Workspace
                    </h2>
                    <p className="text-sm text-slate-300 mt-1">
                      Real-time editing and drawing collaboration
                    </p>
                  </div>
                  <button
                    onClick={saveAllData}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save All
                      </>
                    )}
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-slate-700/50 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('text')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                      activeTab === 'text'
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                        : 'text-slate-300 hover:text-pink-400 hover:bg-slate-600/50 hover:scale-105'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      Text Editor
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('drawing')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                      activeTab === 'drawing'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'text-slate-300 hover:text-purple-400 hover:bg-slate-600/50 hover:scale-105'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Drawing Board
                    </div>
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto bg-slate-800/30 backdrop-blur-sm">
                {activeTab === 'text' ? (
                  <Board 
                    content={boardContent}
                    onChange={handleBoardChange}
                    roomId={roomId}
                  />
                ) : (
                  <DrawingBoard roomId={roomId} connectedUsers={connectedUsers} />
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Edit Message Modal */}
      <EditMessageModal
        message={editingMessage}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveEditedMessage}
      />


      {/* Notification */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
