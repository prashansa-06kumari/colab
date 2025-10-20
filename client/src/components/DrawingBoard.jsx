import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Palette, Download, RotateCcw, Star, Coins, Undo2, Trash2, Users } from 'lucide-react';
import socketService from '../services/socket';
import streakService from '../services/streakService';
import activityService from '../services/activityService';
import historyService from '../services/historyService';
import analyticsService from '../services/analyticsService';

const DrawingBoard = ({ roomId, connectedUsers = [] }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [strokeHistory, setStrokeHistory] = useState([]);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [drawingSessionStarted, setDrawingSessionStarted] = useState(false);
  const [drawingSessionId, setDrawingSessionId] = useState(null);
  const [userCursors, setUserCursors] = useState({});
  // Generate a unique color for this user based on their ID
  const generateUserColor = (userId) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ];
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const [userColor, setUserColor] = useState(() => generateUserColor(socketService.user?.id || 'default'));
  const [points, setPoints] = useState({}); // Store points received by each user
  const [pointsGiven, setPointsGiven] = useState({}); // Store points given by each user
  const [myPoints, setMyPoints] = useState(0); // Current user's total points received
  const [myPointsGiven, setMyPointsGiven] = useState(0); // Current user's total points given
  const [dailyPointsReceived, setDailyPointsReceived] = useState(0); // Daily points received (resets each day)
  const [dailyPointsGiven, setDailyPointsGiven] = useState(0); // Daily points given (resets each day)
  const [showPointsInput, setShowPointsInput] = useState(false);
  const [pointsInput, setPointsInput] = useState('');
  const [targetUser, setTargetUser] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]); // Store online users
  const [drawingNotifications, setDrawingNotifications] = useState([]); // Store drawing notifications
  const [isLoadingPoints, setIsLoadingPoints] = useState(false); // Track points loading state
  const [pointsLoaded, setPointsLoaded] = useState(false); // Track if points have been loaded

  // Generate consistent user color based on user ID
  useEffect(() => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#FF9F43', '#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E',
      '#E17055', '#00B894', '#00CEC9', '#6C5CE7', '#A29BFE'
    ];
    
    // Generate consistent color based on user ID
    if (socketService.user?.id) {
      const userId = socketService.user.id;
      const hash = userId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const colorIndex = Math.abs(hash) % colors.length;
      setUserColor(colors[colorIndex]);
      console.log('🎨 User color assigned:', colors[colorIndex], 'for user:', socketService.user.name);
    } else {
      // Fallback to random color
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setUserColor(randomColor);
    }
  }, [socketService.user?.id]);

  // Update online users when connectedUsers prop changes
  useEffect(() => {
    if (connectedUsers.length > 0) {
      console.log('👥 ConnectedUsers updated:', connectedUsers);
      setOnlineUsers(connectedUsers);
    }
  }, [connectedUsers]);

  // Load daily points counters from analytics service
  useEffect(() => {
    if (socketService.user?.id) {
      // Load daily counters (these reset each day)
      const dailyReceived = analyticsService.getDailyPointsReceived();
      const dailyGiven = analyticsService.getDailyPointsGiven();
      
      setDailyPointsReceived(dailyReceived);
      setDailyPointsGiven(dailyGiven);
      
      console.log('📊 Daily points loaded:', {
        received: dailyReceived,
        given: dailyGiven
      });
    }
  }, [socketService.user?.id]);

  // Listen for daily reset events
  useEffect(() => {
    const handleDailyReset = () => {
      console.log('📅 Daily reset detected in DrawingBoard');
      setDailyPointsReceived(0);
      setDailyPointsGiven(0);
    };

    window.addEventListener('dailyReset', handleDailyReset);
    
    return () => {
      window.removeEventListener('dailyReset', handleDailyReset);
    };
  }, []);

  // Initialize activity service and load points from database when component mounts
  useEffect(() => {
    // Initialize activity service
    if (socketService.user?.id) {
      activityService.initialize(socketService.user.id);
      historyService.initialize(socketService.user.id);
      analyticsService.initialize(socketService.user.id);
      console.log('🎯 Activity, history, and analytics services initialized for user:', socketService.user.id);
    }
    
    // Listen for user switching events
    const handleUserSwitch = () => {
      console.log('🔄 DrawingBoard - User switched, clearing cursors and reinitializing');
      setUserCursors({});
      
      // Reinitialize services with new user
      if (socketService.user?.id) {
        activityService.initialize(socketService.user.id);
        historyService.initialize(socketService.user.id);
        analyticsService.initialize(socketService.user.id);
        
        // Update user color for new user
        const newUserColor = generateUserColor(socketService.user.id);
        setUserColor(newUserColor);
        console.log('🎨 Updated user color for new user:', newUserColor);
        
        console.log('🔄 DrawingBoard - Services reinitialized for new user:', socketService.user.id);
      }
    };
    
    window.addEventListener('userSwitched', handleUserSwitch);
    return () => window.removeEventListener('userSwitched', handleUserSwitch);
    
    // Only load points if they haven't been loaded yet
    if (pointsLoaded) {
      console.log('📊 Points already loaded, skipping...');
      return;
    }

    const loadPoints = () => {
      console.log('🔍 Socket status:', {
        hasSocket: !!socketService.socket,
        connected: socketService.connected,
        user: socketService.user
      });
      if (socketService.socket && socketService.connected) {
        console.log('📊 Requesting points from database on component mount');
        setIsLoadingPoints(true); // Start loading indicator
        socketService.socket.emit('requestUserPoints', {
          userName: socketService.user?.name || 'You'
        });
      } else {
        console.log('📊 Socket not ready, retrying in 1 second...');
        setTimeout(loadPoints, 1000);
      }
    };
    
    // Load points immediately
    loadPoints();
  }, [socketService.connected, pointsLoaded]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Set default styles
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socketService.socket) {
      console.log('❌ Socket not available');
      return;
    }
    
    console.log('✅ Socket available, setting up drawing listeners');
    console.log('🔌 Socket connection status:', {
      connected: socketService.connected,
      hasSocket: !!socketService.socket,
      roomId: roomId
    });
    
    // Join the room
    console.log('🚀 DrawingBoard joining room:', roomId);
    socketService.joinRoom(roomId);

    const handleDrawing = (data) => {
      console.log('🎨 Received drawing data:', data);
      
      if (data.roomId !== roomId) {
        console.log('❌ Room ID mismatch:', data.roomId, 'vs', roomId);
        return;
      }
      
      const canvas = canvasRef.current;
      if (!canvas) {
        console.log('❌ Canvas not found');
        return;
      }

      const ctx = canvas.getContext('2d');
      console.log('✅ Drawing stroke:', data.stroke.length, 'points, color:', data.color, 'size:', data.size);
      
      // Draw the stroke on the canvas
      drawStroke(ctx, data.stroke, data.color, data.size);
      
      // Don't add to stroke history here - it's already handled by the sender
      // This prevents double counting of strokes
      
      console.log('✅ Stroke rendered on canvas');
    };

    const handleClearCanvas = (data) => {
      if (data.roomId !== roomId) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setStrokeHistory([]);
    };

    const handleUserCursorMove = (data) => {
      if (data.roomId !== roomId) return;
      
      setUserCursors(prev => ({
        ...prev,
        [data.userId]: {
          x: data.x,
          y: data.y,
          color: data.color,
          username: data.username,
          timestamp: Date.now()
        }
      }));
    };

    const handleUserDisconnected = (data) => {
      setUserCursors(prev => {
        const newCursors = { ...prev };
        delete newCursors[data.userId];
        return newCursors;
      });
    };

    socketService.socket.on('drawing', handleDrawing);
    socketService.socket.on('clearCanvas', handleClearCanvas);
    socketService.socket.on('userCursorMove', handleUserCursorMove);
    socketService.socket.on('userDisconnected', handleUserDisconnected);
    socketService.socket.on('testResponse', (data) => {
      console.log('✅ Server responded to test:', data);
    });
    socketService.socket.on('broadcastTest', (data) => {
      console.log('📡 Received broadcast test:', data);
      alert(`Broadcast received: ${data.message}`);
    });
    
            // Points system events
            socketService.socket.on('pointsReceived', (data) => {
              console.log('⭐ Points received:', data);
              
              // Update points for the target user (who received the points)
              setPoints(prev => ({
                ...prev,
                [data.targetUser]: (prev[data.targetUser] || 0) + data.points
              }));
              
              // Update current user's points if they are the target
              const currentUserName = socketService.user?.name || 'You';
              if (data.targetUser === currentUserName) {
                setMyPoints(prev => prev + data.points);
                
                // Update daily counter
                setDailyPointsReceived(prev => prev + data.points);
                
                // Track points received activity for streak
                streakService.trackPointsReceived(data.points, data.fromUser);
                
                // Record activity for calendar
                activityService.recordActivity('points_received', `Received ${data.points} points from ${data.fromUser}`);
                
                // Update daily points received counter (resets each day)
                analyticsService.addToDailyPointsReceived(data.points);
                
                alert(`⭐ You received ${data.points} points from ${data.fromUser}!`);
              } else {
                alert(`⭐ ${data.targetUser} received ${data.points} points from ${data.fromUser}!`);
              }
            });
    
    socketService.socket.on('pointsUpdate', (data) => {
      console.log('📊 Points update:', data);
      setPoints(data.points);
    });
    
    // Points given tracking
    socketService.socket.on('pointsGivenUpdate', (data) => {
      console.log('📤 Points given update:', data);
      setPointsGiven(prev => ({
        ...prev,
        [data.fromUser]: (prev[data.fromUser] || 0) + data.pointsGiven
      }));
      
      // Update current user's points given if they are the sender
      const currentUserName = socketService.user?.name || 'You';
      if (data.fromUser === currentUserName) {
        setMyPointsGiven(prev => prev + data.pointsGiven);
      }
    });
    
            // Load user points from database
            socketService.socket.on('loadUserPoints', (data) => {
              console.log('📊 Loading user points from database:', data);
              setIsLoadingPoints(false); // Stop loading indicator
              setPointsLoaded(true); // Mark points as loaded
              if (data && typeof data.pointsReceived === 'number' && typeof data.pointsGiven === 'number') {
                setMyPoints(data.pointsReceived);
                setMyPointsGiven(data.pointsGiven);
                console.log(`📊 Points loaded successfully: Received=${data.pointsReceived}, Given=${data.pointsGiven}`);
              } else {
                console.warn('⚠️ Invalid points data received:', data);
                setMyPoints(0);
                setMyPointsGiven(0);
              }
            });
            
            // Points error handling
            socketService.socket.on('pointsError', (data) => {
              console.log('❌ Points error:', data);
              alert(`❌ ${data.message || 'An error occurred with the points system'}`);
            });
    
    // Online users events
    socketService.socket.on('usersInRoom', (users) => {
      console.log('👥 Users in room:', users);
      setOnlineUsers(users);
    });
    
    socketService.socket.on('userJoined', (data) => {
      console.log('👋 User joined:', data);
      setOnlineUsers(prev => [...prev, data]);
    });
    
    socketService.socket.on('userLeft', (data) => {
      console.log('👋 User left:', data);
      setOnlineUsers(prev => prev.filter(user => user.userId !== data.userId));
    });
    
    // Drawing notifications
    socketService.socket.on('userStartedDrawing', (data) => {
      console.log('🎨 User started drawing:', data);
      const notificationId = Date.now();
      setDrawingNotifications(prev => [...prev, {
        id: notificationId,
        message: `${data.userName} is drawing...`,
        timestamp: Date.now()
      }]);
      
      // Remove notification after 3 seconds
      setTimeout(() => {
        setDrawingNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      }, 3000);
    });
    
    // Add a simple connection test
    console.log('🔌 Socket connection details:', {
      connected: socketService.socket.connected,
      id: socketService.socket.id,
      roomId: roomId
    });

    return () => {
      console.log('🧹 Cleaning up drawing board listeners');
      socketService.off('drawing', handleDrawing);
      socketService.off('clearCanvas', handleClearCanvas);
      socketService.off('userCursorMove', handleUserCursorMove);
      socketService.off('userDisconnected', handleUserDisconnected);
      socketService.off('testResponse');
      socketService.off('broadcastTest');
      socketService.off('pointsReceived');
      socketService.off('pointsUpdate');
      socketService.off('pointsGivenUpdate');
      socketService.off('loadUserPoints');
      socketService.off('pointsError');
      socketService.off('usersInRoom');
      socketService.off('userJoined');
      socketService.off('userLeft');
      socketService.off('userStartedDrawing');
      
      // Note: Room leaving is handled by Dashboard component
      
      // Cleanup cursor timeout
      if (cursorMoveTimeoutRef.current) {
        clearTimeout(cursorMoveTimeoutRef.current);
      }
    };
  }, [roomId]);

  // Cleanup cursor timeout on unmount
  useEffect(() => {
    return () => {
      // Reset drawing session state
      setDrawingSessionStarted(false);
      setDrawingSessionId(null);
      
      if (cursorMoveTimeoutRef.current) {
        clearTimeout(cursorMoveTimeoutRef.current);
      }
    };
  }, []);

  // Draw a stroke on canvas
  const drawStroke = (ctx, points, color, size) => {
    if (!points || points.length < 2) return;

    // Save current context state
    ctx.save();
    
    // Set stroke properties
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw the stroke
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    
    // Restore context state
    ctx.restore();
  };

  // Get mouse/touch position relative to canvas
  const getEventPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  // Throttled cursor movement tracking
  const cursorMoveTimeoutRef = useRef(null);
  
  const handleCursorMove = (e) => {
    const pos = getEventPos(e);
    
    // Throttle cursor updates to improve performance
    if (cursorMoveTimeoutRef.current) {
      clearTimeout(cursorMoveTimeoutRef.current);
    }
    
    cursorMoveTimeoutRef.current = setTimeout(() => {
      // Emit cursor position to other users
      if (socketService.socket) {
        socketService.socket.emit('drawingCursorMove', {
          roomId,
          x: pos.x,
          y: pos.y,
          color: userColor,
          username: socketService.user?.name || 'You'
        });
      }
    }, 50); // Throttle to 20fps for smooth performance
  };

  // Points system functions
  const givePoints = (points, targetUser) => {
    if (socketService.socket) {
      const pointsData = {
        roomId,
        points: parseInt(points),
        targetUser,
        fromUser: 'You' // This will be replaced with actual username
      };
      
      console.log('⭐ Giving points:', pointsData);
      socketService.socket.emit('givePoints', pointsData);
      
      // Track points given activity for streak
      streakService.trackPointsGiven(parseInt(points), targetUser);
      
      // Record activity for calendar
      activityService.recordActivity('points_given', `Gave ${points} points to ${targetUser}`);
      
      // Update daily points given counter (resets each day)
      analyticsService.addToDailyPointsGiven(parseInt(points));
      
      // Update personal points given immediately for instant feedback
      setMyPointsGiven(prev => prev + parseInt(points));
      
      // Update daily counter
      setDailyPointsGiven(prev => prev + parseInt(points));
      
      // Show confirmation
      alert(`⭐ Gave ${points} points to ${targetUser}! Your total given: ${myPointsGiven + parseInt(points)}`);
    }
  };
  
  const openPointsInput = () => {
    setShowPointsInput(true);
  };
  
  const closePointsInput = () => {
    setShowPointsInput(false);
    setPointsInput('');
    setTargetUser('');
  };
  
  const submitPoints = () => {
    if (pointsInput && targetUser) {
      // Get current user name from multiple sources
      const currentUserName = socketService.user?.name || 
                             socketService.socket?.user?.name || 
                             'You';
      
      console.log('🔍 Frontend validation:', {
        targetUser,
        currentUserName,
        isSelf: targetUser === currentUserName,
        socketUser: socketService.user,
        socketUser2: socketService.socket?.user
      });
      
      // Check if user is trying to give points to themselves
      if (targetUser === currentUserName || targetUser === 'You') {
        alert('❌ You cannot give points to yourself!');
        return;
      }
      
      // Additional check: if target user is in the filtered list, it should be safe
      const filteredUsers = onlineUsers.filter((user) => {
        const currentUserName = socketService.user?.name || 
                               socketService.socket?.user?.name || 
                               'You';
        return user.userName !== currentUserName && user.userName !== 'You';
      });
      
      const isValidTarget = filteredUsers.some(user => user.userName === targetUser);
      if (!isValidTarget) {
        alert('❌ Invalid target user selected!');
        return;
      }
      
      givePoints(pointsInput, targetUser);
      closePointsInput();
    }
  };



  // Export canvas as PNG
  const exportAsPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas to include cursors
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // Draw the main canvas
    tempCtx.drawImage(canvas, 0, 0);
    
    // Draw user cursors
    Object.values(userCursors).forEach(cursor => {
      if (Date.now() - cursor.timestamp < 5000) { // Only show recent cursors
        tempCtx.fillStyle = cursor.color;
        tempCtx.beginPath();
        tempCtx.arc(cursor.x, cursor.y, 8, 0, 2 * Math.PI);
        tempCtx.fill();
        
        // Add username label
        tempCtx.fillStyle = cursor.color;
        tempCtx.font = '12px Arial';
        tempCtx.fillText(cursor.username, cursor.x + 12, cursor.y - 5);
      }
    });

    // Convert to PNG and download
    const dataURL = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `drawing_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
    link.href = dataURL;
    
    // Record download activity
    activityService.recordActivity('download', 'Downloaded drawing as PNG');
    
    // Record download history
    historyService.addDrawingChange('download_png', 'Downloaded drawing as PNG');
    link.click();
  };

  // Start drawing
  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getEventPos(e);
    const newStroke = [{ x: pos.x, y: pos.y }];
    setCurrentStroke(newStroke);
    
    // Only record drawing session once per session
    if (!drawingSessionStarted) {
      const sessionId = Date.now().toString();
      setDrawingSessionId(sessionId);
      
      // Track drawing activity for streak (only once per session)
      streakService.trackDrawing('stroke');
      
      // Record drawing activity
      activityService.recordActivity('drawing', 'Started drawing session');
      
      // Record drawing history
      historyService.addDrawingChange('drawing_session', 'Started drawing session');
      
      setDrawingSessionStarted(true);
      console.log('🎨 Drawing session started:', sessionId);
    }
    
    // Emit drawing notification to other users
    if (socketService.socket) {
      socketService.socket.emit('userStartedDrawing', {
        roomId,
        userName: 'You' // This will be replaced with actual username
      });
    }
  };

  // Continue drawing
  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const pos = getEventPos(e);
    const newStroke = [...currentStroke, { x: pos.x, y: pos.y }];
    setCurrentStroke(newStroke);

    // Draw on canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(currentStroke[currentStroke.length - 1].x, currentStroke[currentStroke.length - 1].y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  // Stop drawing
  const stopDrawing = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    setIsDrawing(false);
    
    // Save stroke to history
    const newHistory = [...strokeHistory, currentStroke];
    setStrokeHistory(newHistory);
    
    // Emit stroke to other users
    if (socketService.socket) {
      const drawingData = {
        roomId,
        stroke: currentStroke,
        color: currentColor,
        size: brushSize
      };
      console.log('📤 Emitting drawing data:', drawingData);
      socketService.socket.emit('drawing', drawingData);
      console.log('📤 Drawing event emitted to server');
    }
    
    setCurrentStroke([]);
  };

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setStrokeHistory([]);
    setCurrentStroke([]);

    // Record clear canvas activity
    activityService.recordActivity('drawing', 'Cleared the drawing canvas');
    
    // Record clear canvas history
    historyService.addDrawingChange('clear_canvas', 'Cleared the drawing canvas');
    
    // Emit clear to other users
    if (socketService.socket) {
      socketService.socket.emit('clearCanvas', { roomId });
    }
  };

  // Undo last stroke
  const undoLastStroke = () => {
    if (strokeHistory.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all strokes except the last one
    const newHistory = strokeHistory.slice(0, -1);
    setStrokeHistory(newHistory);
    
    newHistory.forEach(stroke => {
      if (stroke.length > 0) {
        drawStroke(ctx, stroke, currentColor, brushSize);
      }
    });
    
    // Record undo activity
    activityService.recordActivity('drawing', 'Undid last drawing stroke');
    
    // Record undo history
    historyService.addDrawingChange('undo_stroke', 'Undid last drawing stroke');
  };

  return (
    <div className="h-full flex flex-col bg-slate-800/30 backdrop-blur-sm">
              {/* Points Display Header */}
              <div className="bg-gradient-to-r from-amber-500/10 to-gold-500/10 border-b border-amber-500/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📥</span>
                      <div>
                        <div className="text-xs text-amber-300">Points Received Today</div>
                        <div className="text-xl font-bold text-white">{dailyPointsReceived}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📤</span>
                      <div>
                        <div className="text-xs text-blue-300">Points Given Today</div>
                        <div className="text-xl font-bold text-white">{dailyPointsGiven}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    Real-time updates
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="glass-effect border-b border-slate-700/50 p-3 sm:p-4 flex items-center gap-2 sm:gap-4 flex-wrap">
        {/* Color Picker */}
        <div className="flex items-center gap-1 sm:gap-2">
          <label className="text-amber-400 text-xs sm:text-sm font-medium hidden sm:block flex items-center gap-1">
            <Palette className="h-3 w-3" />
            Color:
          </label>
          <label className="text-amber-400 text-xs sm:text-sm font-medium sm:hidden">
            <Palette className="h-3 w-3" />
          </label>
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded border border-slate-600 bg-slate-800 cursor-pointer"
          />
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-1 sm:gap-2">
          <label className="text-amber-400 text-xs sm:text-sm font-medium hidden sm:block flex items-center gap-1">
            <Palette className="h-3 w-3" />
            Size:
          </label>
          <label className="text-amber-400 text-xs sm:text-sm font-medium sm:hidden">
            <Palette className="h-3 w-3" />
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-16 sm:w-20 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-slate-300 text-xs sm:text-sm w-4 sm:w-6">{brushSize}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          <button
            onClick={openPointsInput}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 transition-all duration-300 hover:scale-110 hover:rotate-1 hover:animate-pulse rounded-lg"
          >
            <span className="hidden sm:inline flex items-center gap-1">
              <Star className="h-4 w-4" />
              Give Points
            </span>
            <span className="sm:hidden">
              <Star className="h-4 w-4" />
            </span>
          </button>
          <button
            onClick={exportAsPNG}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 transition-all duration-300 hover:scale-110 hover:rotate-1 hover:animate-pulse rounded-lg"
          >
            <span className="hidden sm:inline flex items-center gap-1">
              <Download className="h-4 w-4" />
              Download PNG
            </span>
            <span className="sm:hidden">
              <Download className="h-4 w-4" />
            </span>
          </button>
          <button
            onClick={undoLastStroke}
            disabled={strokeHistory.length === 0}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-500 disabled:to-gray-600 text-white disabled:text-gray-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 hover:rotate-1 hover:animate-bounce rounded-lg"
          >
            <span className="hidden sm:inline flex items-center gap-1">
              <Undo2 className="h-4 w-4" />
              Undo
            </span>
            <span className="sm:hidden">
              <Undo2 className="h-4 w-4" />
            </span>
          </button>
          <button
            onClick={clearCanvas}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 transition-all duration-300 hover:scale-110 hover:rotate-1 hover:animate-pulse rounded-lg"
          >
            <span className="hidden sm:inline flex items-center gap-1">
              <Trash2 className="h-4 w-4" />
              Clear
            </span>
            <span className="sm:hidden">
              <Trash2 className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 p-2 sm:p-4 relative">
        <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={(e) => {
              draw(e);
              handleCursorMove(e);
            }}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={(e) => {
              startDrawing(e);
              handleCursorMove(e);
            }}
            onTouchMove={(e) => {
              draw(e);
              handleCursorMove(e);
            }}
            onTouchEnd={stopDrawing}
          />
          
                  {/* User Cursors Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {Object.entries(userCursors)
                      .filter(([userId, cursor]) => Date.now() - cursor.timestamp < 5000)
                      .map(([userId, cursor]) => (
                        <div
                          key={userId}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 will-change-transform"
                          style={{
                            left: `${(cursor.x / (canvasRef.current?.width || 1)) * 100}%`,
                            top: `${(cursor.y / (canvasRef.current?.height || 1)) * 100}%`,
                          }}
                        >
                          {/* Cursor with glow effect */}
                          <div className="relative">
                            {/* Outer glow */}
                            <div
                              className="absolute inset-0 w-6 h-6 rounded-full animate-ping opacity-30"
                              style={{ backgroundColor: cursor.color }}
                            />
                            {/* Main cursor */}
                            <div
                              className="relative w-5 h-5 rounded-full border-2 border-white shadow-xl animate-pulse"
                              style={{ backgroundColor: cursor.color }}
                            />
                            {/* Inner dot */}
                            <div
                              className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                              style={{ backgroundColor: 'white' }}
                            />
                          </div>
                          
                          {/* Username label with better styling */}
                          <div
                            className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-3 py-1 rounded-full whitespace-nowrap shadow-xl border"
                            style={{ 
                              borderColor: cursor.color,
                              boxShadow: `0 0 10px ${cursor.color}40`
                            }}
                          >
                            <span className="font-medium" style={{ color: cursor.color }}>
                              {cursor.username}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
        </div>
      </div>

              {/* Status Bar */}
              <div className="glass-effect border-t border-slate-700/50 p-2 sm:p-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2 sm:gap-4">
                    <span className="text-amber-400 flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Drawing Board
                    </span>
                    <span className="text-slate-400 hidden sm:inline">Strokes: {strokeHistory.length}</span>
                    <span className="text-slate-400 sm:hidden">{strokeHistory.length}</span>
                    <span className="text-slate-400">
                      Active: {Object.keys(userCursors).length + 1}
                    </span>
                    <span className={`text-xs ${socketService.connected ? 'text-green-400' : 'text-red-400'}`}>
                      {socketService.connected ? '🟢 Connected' : '🔴 Disconnected'}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    {isDrawing && <span className="text-amber-400 animate-pulse">Drawing...</span>}
                  </div>
                </div>
                
                {/* Drawing Notifications */}
                {drawingNotifications.length > 0 && (
                  <div className="mt-2 p-2 bg-slate-800/50 rounded-lg">
                    <div className="text-xs text-amber-400 mb-1 flex items-center gap-1">
                      <Palette className="h-3 w-3" />
                      Drawing Activity
                    </div>
                    <div className="space-y-1">
                      {drawingNotifications.map((notif) => (
                        <div key={notif.id} className="text-xs bg-slate-700/50 px-2 py-1 rounded animate-pulse">
                          {notif.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Personal Points Display - Always Show */}
                <div className="mt-2 p-3 bg-gradient-to-r from-amber-500/20 to-gold-500/20 rounded-lg border border-amber-500/30">
                  <div className="text-sm text-amber-400 mb-2 font-bold flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span>Your Points Summary</span>
                    {isLoadingPoints && <span className="text-xs text-slate-400 animate-pulse">⏳ Loading...</span>}
                  </div>
                  <div className="flex gap-4">
                    <div className="text-sm bg-green-700/50 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
                      <span className="text-lg">📥</span>
                      <div>
                        <div className="text-xs text-green-300">Received</div>
                        <div className="text-lg font-bold text-white">
                          {isLoadingPoints ? '⏳' : myPoints}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm bg-blue-700/50 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
                      <span className="text-lg">📤</span>
                      <div>
                        <div className="text-xs text-blue-300">Given</div>
                        <div className="text-lg font-bold text-white">
                          {isLoadingPoints ? '⏳' : dailyPointsGiven}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-400 text-center">
                    {isLoadingPoints ? 'Loading points from database...' : 'Updates in real-time when points are given/received'}
                  </div>
                </div>

                {/* Points Display */}
                {(Object.keys(points).length > 0 || Object.keys(pointsGiven).length > 0) && (
                  <div className="mt-2 p-2 bg-slate-800/50 rounded-lg">
                    <div className="text-xs text-amber-400 mb-1 flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Points System
                    </div>
                    
                    {/* Points Received Leaderboard */}
                    {Object.keys(points).length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-slate-300 mb-1">📥 Points Received</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(points)
                            .sort(([,a], [,b]) => b - a)
                            .map(([user, userPoints]) => (
                              <div key={user} className="text-xs bg-slate-700/50 px-2 py-1 rounded">
                                {user}: {userPoints} pts
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Points Given Tracking */}
                    {Object.keys(pointsGiven).length > 0 && (
                      <div>
                        <div className="text-xs text-slate-300 mb-1">📤 Points Given</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(pointsGiven)
                            .sort(([,a], [,b]) => b - a)
                            .map(([user, userPointsGiven]) => (
                              <div key={user} className="text-xs bg-blue-700/50 px-2 py-1 rounded">
                                {user}: {userPointsGiven} given
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Points Input Modal */}
              {showPointsInput && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                    <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Give Points
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-300 mb-2">Points to give:</label>
                        <input
                          type="number"
                          value={pointsInput}
                          onChange={(e) => setPointsInput(e.target.value)}
                          placeholder="Enter points (1-100)"
                          min="1"
                          max="100"
                          className="w-full px-3 py-2 bg-slate-700 text-slate-100 rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-slate-300 mb-2">To user:</label>
                        <select
                          value={targetUser}
                          onChange={(e) => setTargetUser(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 text-slate-100 rounded border border-slate-600 focus:border-amber-500 focus:outline-none"
                        >
                          <option value="">Select a user</option>
                          {onlineUsers
                            .filter((user) => {
                              // Get current user name from multiple sources
                              const currentUserName = socketService.user?.name || 
                                                    socketService.socket?.user?.name || 
                                                    'You';
                              
                              console.log('🔍 Filtering users:', {
                                currentUserName,
                                userToCheck: user.userName,
                                shouldFilter: user.userName === currentUserName
                              });
                              
                              // Filter out current user
                              return user.userName !== currentUserName && user.userName !== 'You';
                            })
                            .map((user) => (
                              <option key={user.userId} value={user.userName}>
                                {user.userName}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={submitPoints}
                        className="flex-1 bg-amber-500 text-slate-900 px-4 py-2 rounded font-medium hover:bg-amber-400 transition-colors"
                      >
                        Give Points
                      </button>
                      <button
                        onClick={closePointsInput}
                        className="flex-1 bg-slate-600 text-slate-200 px-4 py-2 rounded font-medium hover:bg-slate-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
    </div>
  );
};

export default DrawingBoard;
