/**
 * Authentication Context
 * Manages user authentication state and provides auth methods
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import socketService from '../services/socket';

const AuthContext = createContext();

/**
 * Custom hook to use authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 * Wraps the app and provides authentication state
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fallback to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('⚠️ Loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  /**
   * Check if user is logged in on app start
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking authentication...');
        console.log('🔍 Current path:', window.location.pathname);
        
        // Use sessionStorage for tab isolation
        const token = sessionStorage.getItem('token');
        console.log('🔍 Token found:', !!token);
        
        if (token) {
          console.log('🔍 Making getMe API call...');
          const response = await authAPI.getMe();
          console.log('🔍 Auth check response:', response);
          
          if (response.success) {
            console.log('🔍 User authenticated:', response.data.user.name);
            setUser(response.data.user);
            setIsAuthenticated(true);
            
            // Connect to socket with token
            socketService.connect(token);
          } else {
            console.log('🔍 Invalid token, clearing storage');
            // Invalid token, clear storage
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
          }
        } else {
          console.log('🔍 No token found, user not authenticated');
        }
      } catch (error) {
        console.error('🔍 Auth check failed:', error);
        console.error('🔍 Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      } finally {
        console.log('🔍 Setting loading to false');
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   */
  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration for:', userData.email);
      setLoading(true);
      
      const response = await authAPI.register(userData);
      console.log('📝 Registration response:', response);
      
      if (response.success) {
        const { user: newUser, token } = response.data;
        console.log('📝 Registration successful for:', newUser.name);
        
        // Store token and user data in sessionStorage for tab isolation
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(newUser));
        
        setUser(newUser);
        setIsAuthenticated(true);
        
        // Connect to socket
        socketService.connect(token);
        
        return { success: true, user: newUser };
      } else {
        console.log('📝 Registration failed:', response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('📝 Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    } finally {
      console.log('📝 Setting loading to false');
      setLoading(false);
    }
  };

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   */
  const login = async (credentials) => {
    try {
      console.log('🔐 Attempting login with:', credentials.email);
      setLoading(true);
      
      const response = await authAPI.login(credentials);
      console.log('🔐 Login response:', response);
      
      if (response.success) {
        const { user: userData, token } = response.data;
        console.log('🔐 Login successful for:', userData.name);
        console.log('🔐 Token received:', token ? 'Yes' : 'No');
        
        // Store token and user data in sessionStorage for tab isolation
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        console.log('🔐 Stored in sessionStorage:', {
          token: !!sessionStorage.getItem('token'),
          user: !!sessionStorage.getItem('user')
        });
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // Switch user in socket service (handles disconnection and reconnection)
        socketService.switchUser(token);
        
        // Dispatch user switched event for components to update
        window.dispatchEvent(new CustomEvent('userSwitched', { 
          detail: { user: userData } 
        }));
        
        return { success: true, user: userData };
      } else {
        console.log('🔐 Login failed:', response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('🔐 Login error:', error);
      console.error('🔐 Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    } finally {
      console.log('🔐 Setting loading to false');
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = () => {
    // Clear session storage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    // Clear state
    setUser(null);
    setIsAuthenticated(false);
    
    // Disconnect socket
    socketService.disconnect();
  };

  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   */
  const updateUser = (userData) => {
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
