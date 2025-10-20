/**
 * Notification Component
 * Shows temporary notifications with animations
 */

import React, { useState, useEffect } from 'react';

const Notification = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for animation to complete
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/90 text-white border-green-400';
      case 'error':
        return 'bg-red-500/90 text-white border-red-400';
      case 'info':
        return 'bg-blue-500/90 text-white border-blue-400';
      case 'warning':
        return 'bg-yellow-500/90 text-black border-yellow-400';
      default:
        return 'bg-slate-500/90 text-white border-slate-400';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg border shadow-lg backdrop-blur-md transition-all duration-300 ${
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 -translate-y-2 scale-95'
      } ${getTypeStyles()}`}
    >
      <div className="flex items-center space-x-3">
        <div className="text-xl">
          {type === 'success' && '✅'}
          {type === 'error' && '❌'}
          {type === 'info' && 'ℹ️'}
          {type === 'warning' && '⚠️'}
        </div>
        <div className="font-medium">{message}</div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          className="ml-2 text-white/80 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Notification;
