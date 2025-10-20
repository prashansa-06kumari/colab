/**
 * Navbar Component
 * Displays user information and logout functionality
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, LogOut, Save, Users, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ onSave, isSaving, lastSaved, connectedUsers = [], showStreak, onToggleStreak }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

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
    <nav className="bg-primary-dark/95 backdrop-blur-md shadow-2xl border-b border-bronze-tone/30 sticky top-0 z-30 relative">
      {/* Glowing bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-bronze-tone to-transparent animate-glow-pulse"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: App Logo and Navigation */}
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold bg-gradient-to-r from-accent-gold to-bronze-tone bg-clip-text text-transparent font-poppins">
              CollabSpace
            </h1>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  location.pathname === '/dashboard'
                    ? 'bg-bronze-tone/20 text-bronze-tone animate-pulse'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 hover:scale-110 hover:rotate-1'
                }`}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/analytics"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  location.pathname === '/analytics'
                    ? 'bg-bronze-tone/20 text-bronze-tone animate-pulse'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 hover:scale-110 hover:rotate-1'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Link>
            </div>
          </div>

          {/* Center: Save All Button and Streak Toggle */}
          <div className="flex items-center gap-4">
            {onSave && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 hover:rotate-1 hover:animate-pulse rounded-lg"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save All
                  </>
                )}
              </button>
            )}
            
            {/* Streak Toggle Button */}
            <button
              onClick={onToggleStreak}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-500 hover:scale-110 hover:rotate-2 ${
                showStreak 
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg animate-pulse' 
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:animate-bounce'
              }`}
            >
              {showStreak ? (
                <>
                  <Flame className="h-4 w-4" />
                  Hide Streak
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4" />
                  Show Streak
                </>
              )}
            </button>

            
            {/* Save status indicator */}
            {lastSaved && (
              <div className="flex items-center gap-1 text-xs text-accent-gold">
                <div className="w-1.5 h-1.5 bg-accent-gold rounded-full animate-glow-pulse"></div>
                <span className="font-inter">{lastSaved}</span>
              </div>
            )}
          </div>

          {/* Right: Online Users Indicator */}
          <div className="flex items-center space-x-4">
            {/* Online Users Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 px-3 py-2 bg-secondary-blue/40 hover:bg-secondary-blue/60 rounded-xl border border-bronze-tone/30 transition-all duration-300 hover:scale-105">
                <Users className="h-5 w-5 text-accent-gold" />
                <span className="text-sm font-medium text-accent-gold font-poppins">
                  {connectedUsers?.length || 0} Online
                </span>
                <svg className="w-4 h-4 text-bronze-tone transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Content */}
              <div className="absolute right-0 top-full mt-2 w-64 bg-panel-bg/95 backdrop-blur-md rounded-xl shadow-2xl border border-bronze-tone/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-accent-gold font-poppins mb-3">Online Users</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {connectedUsers?.length > 0 ? (
                      connectedUsers.map((user, index) => (
                        <div key={user.userId || index} className="flex items-center space-x-3 p-2 hover:bg-bronze-tone/10 rounded-lg transition-colors duration-200">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent-gold to-bronze-tone flex items-center justify-center shadow-md">
                            <span className="text-xs font-semibold text-primary-dark font-poppins">
                              {user.userName?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-bright font-poppins truncate">
                              {user.userName || 'Unknown User'}
                            </p>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-accent-gold rounded-full animate-glow-pulse"></div>
                              <span className="text-xs text-bronze-tone font-inter">Online</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-bronze-tone">
                        <p className="text-sm font-inter">No other users online</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle className="mr-2" />

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent-gold to-bronze-tone flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 gold-glow">
                <span className="text-sm font-semibold text-primary-dark font-poppins">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-accent-gold font-poppins">
                  {user?.name}
                </p>
                <p className="text-xs text-bronze-tone font-inter">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-bronze-tone hover:text-accent-gold transition-all duration-300 hover:rotate-3 hover:scale-110"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
