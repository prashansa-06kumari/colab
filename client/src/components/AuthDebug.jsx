/**
 * AuthDebug Component
 * Shows current authentication state for debugging
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';

const AuthDebug = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 rounded-lg p-3 shadow-lg z-50">
      <div className="text-xs font-mono">
        <div className="font-bold text-red-800 mb-1">Auth Debug</div>
        <div>Loading: {loading ? 'true' : 'false'}</div>
        <div>Authenticated: {isAuthenticated ? 'true' : 'false'}</div>
        <div>User: {user ? user.name : 'null'}</div>
        <div>Token: {sessionStorage.getItem('token') ? 'exists' : 'missing'}</div>
      </div>
    </div>
  );
};

export default AuthDebug;
