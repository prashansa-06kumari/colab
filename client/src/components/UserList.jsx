/**
 * UserList Component
 * Displays list of connected users
 */

import React from 'react';

const UserList = ({ users }) => {
  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-accent-gold mb-4 flex items-center gap-2 font-poppins">
        <div className="w-2 h-2 bg-accent-gold rounded-full animate-glow-pulse"></div>
        Online Users ({users.length})
      </h3>
      
      {users.length === 0 ? (
        <div className="text-center py-6 text-bronze-tone">
          <div className="text-4xl mb-3 opacity-50">👥</div>
          <p className="text-sm font-medium text-text-bright font-poppins">No other users online</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {users.map((user, index) => (
            <div
              key={user.userId || index}
              className="flex items-center space-x-3 p-3 bg-secondary-blue/40 hover:bg-secondary-blue/60 rounded-xl border border-bronze-tone/30 transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-up"
            >
              {/* User avatar */}
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent-gold to-bronze-tone flex items-center justify-center shadow-md transition-all duration-300 hover:scale-110 gold-glow">
                  <span className="text-xs font-semibold text-primary-dark font-poppins">
                    {user.userName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              
              {/* User info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-accent-gold truncate font-poppins">
                  {user.userName || 'Unknown User'}
                </p>
                <p className="text-xs text-bronze-tone truncate font-inter">
                  {user.userEmail || ''}
                </p>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-accent-gold rounded-full animate-glow-pulse"></div>
                  <span className="text-xs text-bronze-tone font-medium font-inter">Online</span>
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
