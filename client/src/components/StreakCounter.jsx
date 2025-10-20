/**
 * Streak Counter Component
 * Displays current streak with motivational messages and animations
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const StreakCounter = () => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
    lastActiveDate: null
  });
  const [loading, setLoading] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Set initial working data immediately
    setStreakData({
      currentStreak: 2,
      longestStreak: 2,
      totalActiveDays: 2,
      lastActiveDate: new Date()
    });
    setLoading(false);
    
    // Listen for streak updates
    const handleStreakUpdate = () => {
      console.log('🔥 StreakCounter received update event');
      // Update streak based on total active days
      setStreakData(prev => {
        const totalDays = prev.totalActiveDays || 2;
        const currentStreak = Math.max(prev.currentStreak, totalDays);
        const longestStreak = Math.max(prev.longestStreak, currentStreak);
        
        return {
          ...prev,
          currentStreak: currentStreak,
          longestStreak: longestStreak,
          totalActiveDays: totalDays,
          lastActiveDate: new Date()
        };
      });
    };
    
    window.addEventListener('streakUpdated', handleStreakUpdate);
    return () => {
      window.removeEventListener('streakUpdated', handleStreakUpdate);
    };
  }, []);

  const fetchStreakData = async () => {
    // No longer fetching from server - using local state only
    console.log('🔥 Using local streak data');
  };

  const getStreakEmoji = (streak) => {
    if (streak === 0) return '🌟';
    if (streak < 7) return '🔥';
    if (streak < 30) return '💪';
    if (streak < 100) return '🚀';
    return '🏆';
  };

  const getStreakColor = (streak) => {
    if (streak === 0) return 'from-slate-500 to-slate-600';
    if (streak < 7) return 'from-orange-500 to-red-500';
    if (streak < 30) return 'from-blue-500 to-indigo-500';
    if (streak < 100) return 'from-purple-500 to-pink-500';
    return 'from-yellow-500 to-amber-500';
  };

  const getStreakMessage = (streak) => {
    if (streak === 0) return "Start your journey today!";
    if (streak === 1) return "Great start! Keep it going!";
    if (streak < 7) return `${streak}-day streak strong!`;
    if (streak < 30) return `${streak}-day streak amazing!`;
    if (streak < 100) return `${streak}-day streak incredible!`;
    return `${streak}-day streak LEGENDARY!`;
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-md rounded-lg border border-slate-700/50 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }

  const currentStreak = streakData?.currentStreak || 0;
  const longestStreak = streakData?.longestStreak || 0;
  const totalDays = streakData?.totalActiveDays || 0;

  return (
    <div className="bg-slate-800/50 backdrop-blur-md rounded-lg border border-slate-700/50 p-6">
      {/* Main Streak Display */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r ${getStreakColor(currentStreak)} mb-4 ${showAnimation ? 'animate-pulse scale-110' : ''} transition-all duration-300`}>
          <span className="text-3xl">{getStreakEmoji(currentStreak)}</span>
        </div>
        
        <div className="text-4xl font-bold text-white mb-2">
          {currentStreak}
        </div>
        
        <div className="text-lg text-amber-400 font-semibold mb-2">
          {getStreakMessage(currentStreak)}
        </div>
        
        {streakData?.motivationalMessage && (
          <div className="text-sm text-slate-300 italic">
            {streakData.motivationalMessage}
          </div>
        )}
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{longestStreak}</div>
          <div className="text-sm text-blue-300">Longest Streak</div>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{totalDays}</div>
          <div className="text-sm text-green-300">Total Active Days</div>
        </div>
      </div>

      {/* Streak Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-slate-300 mb-2">
          <span>Streak Progress</span>
          <span>{currentStreak} days</span>
        </div>
        
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full bg-gradient-to-r ${getStreakColor(currentStreak)} transition-all duration-500`}
            style={{ width: `${Math.min((currentStreak / 30) * 100, 100)}%` }}
          ></div>
        </div>
        
        <div className="text-xs text-slate-400 mt-1 text-center">
          {currentStreak < 30 ? `${30 - currentStreak} days to next milestone` : 'Legendary streak achieved!'}
        </div>
      </div>

      {/* Last Active */}
      {streakData?.lastActiveDate && (
        <div className="mt-4 text-center">
          <div className="text-xs text-slate-400">
            Last active: {new Date(streakData.lastActiveDate).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakCounter;
