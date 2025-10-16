/**
 * API Service
 * Handles all HTTP requests to the backend
 */

import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    console.log('🌐 API - Request interceptor:', {
      url: config.url,
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('🌐 API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      // Only redirect if not already on login page to prevent loops
      if (window.location.pathname !== '/login') {
        console.log('🌐 Redirecting to login due to 401');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    console.log('🌐 API - Login request:', credentials);
    const response = await api.post('/auth/login', credentials);
    console.log('🌐 API - Login response:', response.data);
    return response.data;
  },

  // Get current user profile
  getMe: async () => {
    console.log('🌐 API - GetMe request');
    const response = await api.get('/auth/me');
    console.log('🌐 API - GetMe response:', response.data);
    return response.data;
  },
};

// Messages API
export const messagesAPI = {
  // Get messages for a room
  getMessages: async (roomId, page = 1, limit = 50) => {
    const response = await api.get(`/messages/${roomId}?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Create new message
  createMessage: async (messageData) => {
    const response = await api.post('/messages', messageData);
    return response.data;
  },

  // Update message
  updateMessage: async (messageId, text) => {
    console.log('🌐 API call - updateMessage:', {
      url: `/messages/${messageId}`,
      method: 'PUT',
      messageId,
      text
    });
    const response = await api.put(`/messages/${messageId}`, { text });
    console.log('🌐 API response - updateMessage:', response);
    return response.data;
  },

  // Delete message
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  // Get recent messages
  getRecentMessages: async (roomId, since) => {
    const response = await api.get(`/messages/${roomId}/recent?since=${since}`);
    return response.data;
  },
};

// Board API
export const boardAPI = {
  // Get board content
  getBoard: async (roomId) => {
    const response = await api.get(`/board/${roomId}`);
    return response.data;
  },

  // Update board content
  updateBoard: async (roomId, boardData) => {
    const response = await api.put(`/board/${roomId}`, boardData);
    return response.data;
  },

  // Get board history
  getBoardHistory: async (roomId, limit = 10) => {
    const response = await api.get(`/board/${roomId}/history?limit=${limit}`);
    return response.data;
  },

  // Clear board
  clearBoard: async (roomId) => {
    const response = await api.delete(`/board/${roomId}`);
    return response.data;
  },

  // Undo board
  undoBoard: async (roomId) => {
    const response = await api.post(`/board/${roomId}/undo`);
    return response.data;
  },

  // Redo board
  redoBoard: async (roomId) => {
    const response = await api.post(`/board/${roomId}/redo`);
    return response.data;
  },

  // Export board as JSON (text only)
  exportBoardAsJSON: async (roomId) => {
    const response = await api.get(`/board/${roomId}/export/json`);
    return response.data;
  },

  // Export board as PDF (HTML format)
  exportBoardAsPDF: async (roomId) => {
    const response = await api.get(`/board/${roomId}/export/pdf`, {
      responseType: 'text'
    });
    return response.data;
  },

  // Export board as PNG (SVG format)
  exportBoardAsPNG: async (roomId) => {
    const response = await api.get(`/board/${roomId}/export/png`, {
      responseType: 'text'
    });
    return response.data;
  },
};

export default api;
