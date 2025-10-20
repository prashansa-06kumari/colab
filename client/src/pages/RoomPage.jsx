import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Settings, Copy, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';
import api from '../services/api';
import DrawingBoard from '../components/DrawingBoard';
import Board from '../components/Board';
import MembersPanel from '../components/MembersPanel';
import Notification from '../components/Notification';

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('drawing');
  const [boardContent, setBoardContent] = useState('');
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [notification, setNotification] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchRoomDetails();
    setupSocketListeners();

    return () => {
      if (socketService.socket) {
        socketService.socket.emit('leaveRoomById', roomId);
      }
    };
  }, [roomId, user, navigate]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/rooms/${roomId}`);
      if (response.data.success) {
        setRoom(response.data.data.room);
        
        // Join the room via socket
        if (socketService.socket) {
          socketService.socket.emit('joinRoomById', roomId);
        }
      }
    } catch (error) {
      console.error('Error fetching room details:', error);
      if (error.response?.status === 404) {
        setError('Room not found');
      } else if (error.response?.status === 403) {
        setError('Access denied. You are not a member of this room.');
      } else {
        setError('Failed to load room details');
      }
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    if (!socketService.socket) return;

    const handleUserJoined = (data) => {
      setNotification({
        message: `${data.userName} joined the room`,
        type: 'success'
      });
    };

    const handleUserLeft = (data) => {
      setNotification({
        message: `${data.userName} left the room`,
        type: 'info'
      });
    };

    const handleRoomError = (data) => {
      setError(data.message);
    };

    socketService.socket.on('userJoinedRoom', handleUserJoined);
    socketService.socket.on('userLeftRoom', handleUserLeft);
    socketService.socket.on('roomError', handleRoomError);

    return () => {
      socketService.socket.off('userJoinedRoom', handleUserJoined);
      socketService.socket.off('userLeftRoom', handleUserLeft);
      socketService.socket.off('roomError', handleRoomError);
    };
  };

  const copyRoomLink = async () => {
    const roomLink = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(roomLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleBoardChange = (content) => {
    setBoardContent(content);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Room Error</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-300">Room not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Room Info */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700/50 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                  {room.name}
                </h1>
                {room.description && (
                  <p className="text-sm text-slate-300 mt-1">{room.description}</p>
                )}
              </div>
            </div>

            {/* Room Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={copyRoomLink}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-all duration-300"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </>
                )}
              </button>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Users className="h-4 w-4" />
                <span>{room.members.filter(m => m.isOnline).length}/{room.members.length} online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Side - Drawing Board */}
          <div className="xl:col-span-3">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl">
              {/* Tab Navigation */}
              <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-pink-600/20 to-purple-600/20">
                <div className="flex space-x-1 bg-slate-700/50 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('drawing')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                      activeTab === 'drawing'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'text-slate-300 hover:text-purple-400 hover:bg-slate-600/50 hover:scale-105'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      Drawing Board
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('text')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                      activeTab === 'text'
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                        : 'text-slate-300 hover:text-pink-400 hover:bg-slate-600/50 hover:scale-105'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                      Text Editor
                    </div>
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="h-[600px] overflow-hidden">
                {activeTab === 'drawing' ? (
                  <DrawingBoard roomId={roomId} connectedUsers={connectedUsers} />
                ) : (
                  <Board 
                    content={boardContent}
                    onChange={handleBoardChange}
                    roomId={roomId}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Members Panel */}
          <div className="xl:col-span-1">
            <MembersPanel 
              roomId={roomId} 
              isHost={room.host.id === user.id}
            />
          </div>
        </div>
      </div>

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

export default RoomPage;
