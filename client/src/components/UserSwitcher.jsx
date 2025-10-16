/**
 * UserSwitcher Component
 * Allows quick switching between different users for testing
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const UserSwitcher = () => {
  const { login, logout, register, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Predefined test users for easy switching
  const testUsers = [
    { name: 'Alice Johnson', email: 'alice@test.com', password: 'password123' },
    { name: 'Bob Smith', email: 'bob@test.com', password: 'password123' },
    { name: 'Charlie Brown', email: 'charlie@test.com', password: 'password123' },
    { name: 'Diana Prince', email: 'diana@test.com', password: 'password123' },
    { name: 'Eve Wilson', email: 'eve@test.com', password: 'password123' }
  ];

  /**
   * Switch to a different user
   */
  const switchUser = async (userData) => {
    setIsLoading(true);
    try {
      // First logout current user
      logout();
      
      // Wait a moment for logout to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Login as new user
      const result = await login({
        email: userData.email,
        password: userData.password
      });
      
      if (result.success) {
        console.log(`🔄 Switched to user: ${userData.name}`);
        setIsOpen(false);
      } else {
        console.error('Failed to switch user:', result.message);
        alert(`Failed to switch to ${userData.name}: ${result.message}`);
      }
    } catch (error) {
      console.error('User switch error:', error);
      alert('Failed to switch user');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new test user
   */
  const createTestUser = async (userData) => {
    setIsLoading(true);
    try {
      const result = await register(userData);
      
      if (result.success) {
        console.log(`✅ Created and logged in as: ${userData.name}`);
        setIsOpen(false);
      } else {
        console.error('Failed to create user:', result.message);
        alert(`Failed to create user: ${result.message}`);
      }
    } catch (error) {
      console.error('User creation error:', error);
      alert('Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-xl transition-all duration-300 ease-in-out hover:shadow-lg transform hover:scale-105"
      >
        🔄 Switch User
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 p-4 w-80 z-50">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Current: {user?.name}
            </h3>
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Quick Switch:</h4>
              {testUsers.map((testUser, index) => (
                <button
                  key={index}
                  onClick={() => switchUser(testUser)}
                  disabled={isLoading || testUser.email === user?.email}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{testUser.name}</p>
                      <p className="text-xs text-gray-500">{testUser.email}</p>
                    </div>
                    {testUser.email === user?.email && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Create New User:</h4>
              <button
                onClick={() => {
                  const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
                  createTestUser({
                    name: `Test User ${Date.now()}`,
                    email: `test${Date.now()}@example.com`,
                    password: 'password123'
                  });
                }}
                disabled={isLoading}
                className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Create Random Test User
              </button>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full p-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all duration-200"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default UserSwitcher;
