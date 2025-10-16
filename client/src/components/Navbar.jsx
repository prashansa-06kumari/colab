/**
 * Navbar Component
 * Displays user information and logout functionality
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onSave, isSaving, lastSaved }) => {
  const { user, logout } = useAuth();

  /**
   * Handle logout with save confirmation
   */
  const handleLogout = () => {
    const shouldLogout = window.confirm(
      'Are you sure you want to logout? Make sure to save your work first!'
    );
    
    if (shouldLogout) {
      logout();
    }
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-xl border-b border-white/20 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                CollabSpace
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Save button */}
            {onSave && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl text-sm font-semibold transition-all duration-300 ease-in-out hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                {isSaving ? 'Saving...' : '💾 Save All'}
              </button>
            )}

            {/* Save status */}
            {lastSaved && (
              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-xl">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                Saved: {lastSaved}
              </div>
            )}

            {/* User info */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <span className="text-lg font-semibold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 rounded-xl text-sm font-semibold transition-all duration-300 ease-in-out hover:shadow-md border border-gray-200"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
