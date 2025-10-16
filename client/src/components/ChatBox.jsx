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
    <div className="p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-6xl mb-4 opacity-50">💬</div>
            <p className="text-lg font-medium text-gray-600">No messages yet</p>
            <p className="text-sm text-gray-500 mt-1">Start the conversation!</p>
          </div>
        </div>
      ) : (
        messages.map((message, index) => (
          <div
            key={message.id || index}
            className="flex flex-col space-y-2 group hover:bg-gray-50/50 rounded-xl p-2 -m-2 transition-all duration-200"
          >
            {/* Message bubble */}
            <div className="flex items-start space-x-3">
              {/* User avatar */}
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-semibold text-white">
                    {message.sender?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>

              {/* Message content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {message.sender?.name || 'Unknown User'}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
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
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 max-w-md shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                  <p className="text-sm text-gray-800 break-words leading-relaxed">
                    {message.text}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
      
      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatBox;
