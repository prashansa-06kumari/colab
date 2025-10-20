import React, { useState, useEffect } from 'react';
import { Plus, Users, Calendar, Settings, Trash2, ExternalLink, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const RoomList = ({ onRoomSelect, onCreateRoom }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedRoomId, setCopiedRoomId] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/rooms');
      if (response.data.success) {
        setRooms(response.data.data.rooms);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const copyRoomLink = async (roomId) => {
    const roomLink = `${window.location.origin}/room/${roomId}`;
    try {
      await navigator.clipboard.writeText(roomLink);
      setCopiedRoomId(roomId);
      setTimeout(() => setCopiedRoomId(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const deleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/rooms/${roomId}`);
      if (response.data.success) {
        setRooms(rooms.filter(room => room.roomId !== roomId));
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      setError('Failed to delete room');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={fetchRooms}
          className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
            My Rooms
          </h2>
          <p className="text-slate-300 mt-1">Manage your collaborative spaces</p>
        </div>
        <button
          onClick={onCreateRoom}
          className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Room
        </button>
      </div>

      {/* Rooms Grid */}
      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold text-white mb-2">No rooms yet</h3>
          <p className="text-slate-400 mb-6">Create your first collaborative room to get started</p>
          <button
            onClick={onCreateRoom}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto"
          >
            <Plus className="h-5 w-5" />
            Create Your First Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.roomId}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              {/* Room Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1 truncate">
                    {room.name}
                  </h3>
                  {room.description && (
                    <p className="text-slate-400 text-sm mb-2 line-clamp-2">
                      {room.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {room.isPrivate ? (
                    <div className="w-2 h-2 bg-red-400 rounded-full" title="Private Room"></div>
                  ) : (
                    <div className="w-2 h-2 bg-green-400 rounded-full" title="Public Room"></div>
                  )}
                </div>
              </div>

              {/* Room Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm text-slate-400">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{room.onlineCount}/{room.memberCount} online</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(room.createdAt)}</span>
                </div>
              </div>

              {/* Room Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRoomSelect(room.roomId)}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Join Room
                </button>
                <button
                  onClick={() => copyRoomLink(room.roomId)}
                  className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg transition-all duration-300 hover:scale-105"
                  title="Copy room link"
                >
                  {copiedRoomId === room.roomId ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                {room.host.id === user.id && (
                  <button
                    onClick={() => deleteRoom(room.roomId)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all duration-300 hover:scale-105"
                    title="Delete room"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomList;
