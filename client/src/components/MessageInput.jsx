/**
 * MessageInput Component
 * Handles sending new chat messages
 */

import React, { useState, useRef } from 'react';

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  /**
   * Handle input change
   */
  const handleChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicator
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      // You could emit typing event here if needed
    }

    // Clear typing indicator after user stops typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      setIsTyping(false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-3">
      <div className="flex-1">
        <input
          type="text"
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="input-field w-full px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-gold focus:border-accent-gold resize-none transition-all duration-300 ease-in-out placeholder-bronze-tone text-text-bright font-medium shadow-sm hover:shadow-md hover:scale-105"
          maxLength={1000}
        />
      </div>
      
      <button
        type="submit"
        disabled={!message.trim()}
        className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-300"
      >
        Send
      </button>
    </form>
  );
};

export default MessageInput;
