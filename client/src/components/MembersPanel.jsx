import React, { useState, useEffect } from 'react';
import { Users, User, Clock, Crown, Shield, MoreVertical, UserX } from 'lucide-react';
import socketService from '../services/socket';

const MembersPanel = ({ roomId, isHost = false }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId) return;

    // Get initial room members
    fetchRoomMembers();

    // Set up socket listeners
    const handleRoomMembers = (data) => {
      if (data.roomId === roomId) {
        setMembers(data.members);
        setLoading(false);
      }
    };

    const handleUserJoined = (data) => {
      if (data.roomId === roomId) {
        setMembers(prev => {
          const existingMember = prev.find(m => m.userId === data.userId);
          if (existingMember) {
            return prev.map(m => 
              m.userId === data.userId 
                ? { ...m, isOnline: true, lastSeen: new Date().toISOString() }
                : m
            );
          }
          return [...prev, {
            userId: data.userId,
            userName: data.userName,
            userEmail: data.userEmail,
            isOnline: true,
            lastSeen: new Date().toISOString(),
            joinedAt: new Date().toISOString()
          }];
        });
      }
    };

    const handleUserLeft = (data) => {
      if (data.roomId === roomId) {
        setMembers(prev => 
          prev.map(m => 
            m.userId === data.userId 
              ? { ...m, isOnline: false, lastSeen: new Date().toISOString() }
              : m
          )
        );
      }
    };

    const handleRoomError = (data) => {
      setError(data.message);
      setLoading(false);
    };

    if (socketService.socket) {
      socketService.socket.on('roomMembers', handleRoomMembers);
      socketService.socket.on('userJoinedRoom', handleUserJoined);
      socketService.socket.on('userLeftRoom', handleUserLeft);
      socketService.socket.on('roomError', handleRoomError);

      // Request current room members
      socketService.socket.emit('getRoomMembers', roomId);
    }

    return () => {
      if (socketService.socket) {
        socketService.socket.off('roomMembers', handleRoomMembers);
        socketService.socket.off('userJoinedRoom', handleUserJoined);
        socketService.socket.off('userLeftRoom', handleUserLeft);
        socketService.socket.off('roomError', handleRoomError);
      }
    };
  }, [roomId]);

  const fetchRoomMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      if (socketService.socket) {
        socketService.socket.emit('getRoomMembers', roomId);
      }
    } catch (error) {
      console.error('Error fetching room members:', error);
      setError('Failed to load room members');
      setLoading(false);
    }
  };

  const formatLastSeen = (lastSeen) => {
    const now = new Date();
    const seen = new Date(lastSeen);
    const diffMs = now - seen;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getMemberRole = (member) => {
    if (member.isHost) return 'Host';
    if (member.isOnline) return 'Online';
    return 'Offline';
  };

  const getMemberIcon = (member) => {
    if (member.isHost) return <Crown className="h-4 w-4 text-yellow-400" />;
    if (member.isOnline) return <div className="w-2 h-2 bg-green-400 rounded-full" />;
    return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-pink-400" />
          <h3 className="text-lg font-semibold text-white">Room Members</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-pink-400" />
          <h3 className="text-lg font-semibold text-white">Room Members</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={fetchRoomMembers}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const onlineMembers = members.filter(m => m.isOnline);
  const offlineMembers = members.filter(m => !m.isOnline);

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-pink-400" />
          <h3 className="text-lg font-semibold text-white">Room Members</h3>
        </div>
        <div className="text-sm text-slate-400">
          {onlineMembers.length}/{members.length} online
        </div>
      </div>

      {/* Online Members */}
      {onlineMembers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Online ({onlineMembers.length})
          </h4>
          <div className="space-y-2">
            {onlineMembers.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getMemberIcon(member)}
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{member.userName}</div>
                    <div className="text-xs text-slate-400">{getMemberRole(member)}</div>
                  </div>
                </div>
                {isHost && !member.isHost && (
                  <button
                    className="text-slate-400 hover:text-red-400 transition-colors p-1"
                    title="Remove member"
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline Members */}
      {offlineMembers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            Offline ({offlineMembers.length})
          </h4>
          <div className="space-y-2">
            {offlineMembers.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-3 bg-slate-700/20 rounded-lg opacity-75"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getMemberIcon(member)}
                    <User className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-slate-300 font-medium">{member.userName}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatLastSeen(member.lastSeen)}
                    </div>
                  </div>
                </div>
                {isHost && !member.isHost && (
                  <button
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    title="Remove member"
                  >
                    <UserX className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {members.length === 0 && (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">No members in this room</p>
        </div>
      )}
    </div>
  );
};

export default MembersPanel;
