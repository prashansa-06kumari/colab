/**
 * ChatBox Component
 * Displays chat messages in a scrollable container
 */

import React, { useEffect, useRef } from 'react';
import MessageMenu from './MessageMenu';

const ChatBox = ({ messages, currentUserId, onEditMessage, onDeleteMessage }) => {
  const messagesEndRef = useRef(null);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Format timestamp for display
   */
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="p-6 space-y-4 theme-bg-secondary">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-bronze-tone">
          <div className="text-center">
            <div className="text-6xl mb-4 opacity-50">💬</div>
            <p className="text-lg font-medium text-text-bright font-poppins">No messages yet</p>
            <p className="text-sm text-bronze-tone mt-1 font-inter">Start the conversation!</p>
          </div>
        </div>
      ) : (
        messages.map((message, index) => {
          const isCurrentUser = message.sender?.id === currentUserId;
          
          return (
            <div
              key={message.id || index}
              className={`flex flex-col space-y-2 group hover:bg-bronze-tone/10 rounded-xl p-2 -m-2 transition-all duration-300 animate-message-appear ${
                isCurrentUser ? 'items-end' : 'items-start'
              }`}
            >
              {/* Message bubble */}
              <div className={`flex items-start space-x-3 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {/* User avatar */}
                <div className="flex-shrink-0">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 ${
                    isCurrentUser 
                      ? 'bg-gradient-to-br from-accent-gold to-bronze-tone' 
                      : 'bg-gradient-to-br from-secondary-blue to-primary-dark'
                  }`}>
                    <span className="text-sm font-semibold text-white font-poppins">
                      {message.sender?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>

                {/* Message content */}
                <div className="flex-1 min-w-0 max-w-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-semibold text-accent-gold font-poppins">
                        {message.sender?.name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-bronze-tone font-medium font-inter">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    
                    {/* Message menu */}
                    <MessageMenu
                      message={message}
                      currentUserId={currentUserId}
                      onEdit={onEditMessage}
                      onDelete={onDeleteMessage}
                    />
                  </div>
                  
                  <div className={`rounded-2xl px-4 py-3 shadow-lg border transition-all duration-300 hover:scale-105 ${
                    isCurrentUser 
                      ? 'message-bubble-user' 
                      : 'message-bubble-other'
                  }`}>
                    <p className="text-sm break-words leading-relaxed font-inter">
                      {message.text}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
      
      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatBox;
