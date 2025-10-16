/**
 * UserList Component
 * Displays list of connected users
 */

import React from 'react';

const UserList = ({ users }) => {
  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        Online Users ({users.length})
      </h3>
      
      {users.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <div className="text-4xl mb-3 opacity-50">👥</div>
          <p className="text-sm font-medium text-gray-600">No other users online</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {users.map((user, index) => (
            <div
              key={user.userId || index}
              className="flex items-center space-x-3 p-3 bg-white/60 hover:bg-white/80 rounded-xl border border-gray-100 transition-all duration-200 hover:shadow-md"
            >
              {/* User avatar */}
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                  <span className="text-xs font-semibold text-white">
                    {user.userName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              
              {/* User info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.userName || 'Unknown User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.userEmail || ''}
                </p>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500 font-medium">Online</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserList;
