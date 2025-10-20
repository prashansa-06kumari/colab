/**
 * MessageMenu Component
 * 3-dots menu for message CRUD operations
 */

import React, { useState, useRef, useEffect } from 'react';

const MessageMenu = ({ message, onEdit, onDelete, currentUserId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  /**
   * Check if current user can edit/delete this message
   */
  const canModify = message.sender?.id === currentUserId;

  /**
   * Handle menu toggle
   */
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  /**
   * Handle edit message
   */
  const handleEdit = () => {
    console.log('✏️ MessageMenu edit called with message:', message);
    onEdit(message);
    setIsOpen(false);
  };

  /**
   * Handle delete message
   */
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      console.log('🗑️ MessageMenu delete called with ID:', message.id);
      onDelete(message.id);
      setIsOpen(false);
    }
  };

  /**
   * Close menu when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!canModify) {
    return null; // Don't show menu for other users' messages
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* 3-dots button */}
      <button
        onClick={toggleMenu}
        className="p-2 hover:bg-bronze-tone/20 rounded-full transition-all duration-300 hover:scale-110 group"
        title="Message options"
      >
        <svg
          className="w-4 h-4 text-bronze-tone group-hover:text-accent-gold transition-colors duration-300"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-10 bg-panel-bg/95 backdrop-blur-md border border-bronze-tone/30 rounded-xl shadow-2xl z-50 min-w-[140px] animate-scale-in">
          <div className="py-2">
            <button
              onClick={handleEdit}
              className="w-full px-4 py-3 text-left text-sm text-text-bright hover:bg-accent-gold/20 flex items-center space-x-3 transition-all duration-300 hover:scale-105 font-inter group"
            >
              <svg className="w-4 h-4 text-accent-gold group-hover:text-bronze-tone transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="font-medium">Edit</span>
            </button>
            
            <div className="border-t border-bronze-tone/20 my-1"></div>
            
            <button
              onClick={handleDelete}
              className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center space-x-3 transition-all duration-300 hover:scale-105 font-inter group"
            >
              <svg className="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="font-medium">Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageMenu;
