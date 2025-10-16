/**
 * EditMessageModal Component
 * Modal for editing messages
 */

import React, { useState, useEffect } from 'react';

const EditMessageModal = ({ message, isOpen, onClose, onSave }) => {
  const [editText, setEditText] = useState('');

  /**
   * Initialize edit text when modal opens
   */
  useEffect(() => {
    if (isOpen && message) {
      setEditText(message.text);
    }
  }, [isOpen, message]);

  /**
   * Handle save changes
   */
  const handleSave = () => {
    if (editText.trim() && editText.trim() !== message.text) {
      onSave(message.id, editText.trim());
    }
    onClose();
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setEditText('');
    onClose();
  };

  /**
   * Handle Enter key
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit Message
          </h3>
          <p className="text-sm text-gray-500">
            Make your changes and save
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={3}
            maxLength={1000}
            autoFocus
          />
          <div className="mt-2 text-xs text-gray-500">
            {editText.length}/1000 characters
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!editText.trim() || editText.trim() === message.text}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMessageModal;
