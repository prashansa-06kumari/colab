/**
 * Enhanced Activity Calendar Component
 * Displays user's activity calendar with color coding, activity tracking, and date interaction
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Edit, Palette, Star, Gift, Download, FileText, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import historyService from '../services/historyService';

const ActivityCalendar = () => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState({
    currentStreak: 2,
    longestStreak: 2,
    totalActiveDays: 2,
    lastActiveDate: null
  });
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [activityData, setActivityData] = useState({});
  const [showPopup, setShowPopup] = useState(false);

  // Load activity data from localStorage on component mount
  useEffect(() => {
    loadActivityData();
    setLoading(false);
    
    // Initialize history service
    if (user?.id) {
      historyService.initialize(user.id);
    }
    
    // Listen for activity updates
    const handleActivityUpdate = () => {
      loadActivityData();
    };
    
    // Listen for history updates
    const handleHistoryUpdate = () => {
      loadActivityData();
    };
    
    window.addEventListener('activityUpdated', handleActivityUpdate);
    window.addEventListener('historyUpdated', handleHistoryUpdate);
    return () => {
      window.removeEventListener('activityUpdated', handleActivityUpdate);
      window.removeEventListener('historyUpdated', handleHistoryUpdate);
    };
  }, [user]);

  // Load activity data from localStorage
  const loadActivityData = () => {
    try {
      const userId = user?.id || 'default';
      const stored = localStorage.getItem(`activityData_${userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        setActivityData(data);
        updateStreakData(data);
      }
    } catch (error) {
      console.error('Error loading activity data:', error);
    }
  };

  // Update streak data based on activity
  const updateStreakData = (activities) => {
    const dates = Object.keys(activities).sort();
    const totalDays = dates.length;
    const currentStreak = calculateCurrentStreak(dates);
    const longestStreak = calculateLongestStreak(dates);
    
    setStreakData({
      currentStreak,
      longestStreak,
      totalActiveDays: totalDays,
      lastActiveDate: dates.length > 0 ? new Date(dates[dates.length - 1]) : null
    });
  };

  // Calculate current streak (consecutive days from today backwards)
  const calculateCurrentStreak = (dates) => {
    if (dates.length === 0) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    let currentDate = new Date(today);
    
    // Check if today has activity
    if (dates.includes(today)) {
      streak = 1;
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Count consecutive days backwards
    while (dates.includes(currentDate.toISOString().split('T')[0])) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  };

  // Calculate longest streak
  const calculateLongestStreak = (dates) => {
    if (dates.length === 0) return 0;
    
    let longestStreak = 0;
    let currentStreak = 0;
    let previousDate = null;
    
    dates.forEach(date => {
      const currentDate = new Date(date);
      
      if (previousDate === null) {
        currentStreak = 1;
      } else {
        const dayDiff = (currentDate - previousDate) / (1000 * 60 * 60 * 24);
        if (dayDiff === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
      
      previousDate = currentDate;
    });
    
    return Math.max(longestStreak, currentStreak);
  };

  // Record new activity
  const recordActivity = (activityType, details = '') => {
    const today = new Date().toISOString().split('T')[0];
    const userId = user?.id || 'default';
    
    const newActivity = {
      type: activityType,
      timestamp: new Date().toISOString(),
      details: details
    };
    
    setActivityData(prev => {
      const updated = {
        ...prev,
        [today]: [...(prev[today] || []), newActivity]
      };
      
      // Save to localStorage
      localStorage.setItem(`activityData_${userId}`, JSON.stringify(updated));
      
      // Update streak data
      updateStreakData(updated);
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('activityUpdated'));
      
      return updated;
    });
  };

  // Generate calendar days with color coding
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = currentDate.toDateString() === new Date().toDateString();
      // Get date in YYYY-MM-DD format, ensuring consistent timezone
      const dateString = currentDate.getFullYear() + '-' + 
                         String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(currentDate.getDate()).padStart(2, '0');
      const hasActivity = activityData[dateString] && activityData[dateString].length > 0;
      
      // Debug logging for today's date
      if (isToday) {
        console.log('📅 Calendar - Today is:', dateString);
        console.log('📅 Calendar - Has activity:', hasActivity);
        console.log('📅 Calendar - Activity data for today:', activityData[dateString]);
      }
      
      days.push({
        date: new Date(currentDate),
        dateString,
        isCurrentMonth,
        isToday,
        hasActivity,
        activities: activityData[dateString] || []
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  // Navigate between months with smooth transition
  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + direction);
      return newMonth;
    });
  };

  // Handle date click
  const handleDateClick = (day) => {
    setSelectedDate(day);
    setShowPopup(true);
  };

  // Close popup
  const closePopup = () => {
    setShowPopup(false);
    setSelectedDate(null);
  };

  // Get activity icon
  const getActivityIcon = (activityType) => {
    const icons = {
      login: '🔑',
      logout: '🚪',
      message: '💬',
      edit: <Edit className="h-4 w-4" />,
      drawing: <Palette className="h-4 w-4" />,
      points_given: <Star className="h-4 w-4" />,
      points_received: <Gift className="h-4 w-4" />,
      download: <Download className="h-4 w-4" />,
      test: '🧪'
    };
    return icons[activityType] || <FileText className="h-4 w-4" />;
  };

  // Get activity color
  const getActivityColor = (activityType) => {
    const colors = {
      login: 'text-blue-400',
      logout: 'text-red-400',
      message: 'text-green-400',
      edit: 'text-purple-400',
      drawing: 'text-pink-400',
      points_given: 'text-yellow-400',
      points_received: 'text-orange-400',
      download: 'text-cyan-400',
      test: 'text-cyan-400'
    };
    return colors[activityType] || 'text-slate-400';
  };

  // Get date color class
  const getDateColorClass = (day) => {
    if (day.isToday) {
      return 'bg-blue-500 text-white ring-2 ring-blue-400';
    } else if (day.hasActivity) {
      return 'bg-green-500 text-white hover:bg-green-600';
    } else {
      return 'bg-slate-700 text-slate-300 hover:bg-slate-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="theme-card backdrop-blur-md rounded-lg p-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-amber-400 mb-2 flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Activity Calendar
            </div>
          </h3>
          <p className="text-slate-300 text-sm">
            {streakData?.currentStreak || 0} day streak • {streakData?.totalActiveDays || 0} total active days
          </p>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all duration-200 hover:scale-105"
          >
            ←
          </button>
          <h4 className="text-lg font-semibold text-white min-w-[140px] text-center transition-all duration-300">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h4>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all duration-200 hover:scale-105"
          >
            →
          </button>
        </div>
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-amber-500/20 to-gold-500/20 rounded-lg p-4 border border-amber-500/30 hover:from-amber-500/30 hover:to-gold-500/30 transition-all duration-300">
          <div className="text-2xl font-bold text-amber-400">{streakData?.currentStreak || 0}</div>
          <div className="text-sm text-amber-300">Current Streak</div>
        </div>
        <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg p-4 border border-blue-500/30 hover:from-blue-500/30 hover:to-indigo-500/30 transition-all duration-300">
          <div className="text-2xl font-bold text-blue-400">{streakData?.longestStreak || 0}</div>
          <div className="text-sm text-blue-300">Longest Streak</div>
        </div>
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/30 transition-all duration-300">
          <div className="text-2xl font-bold text-green-400">{streakData?.totalActiveDays || 0}</div>
          <div className="text-sm text-green-300">Total Days</div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-slate-400 text-sm font-medium py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`
              aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all duration-300 hover:scale-105
              ${getDateColorClass(day)}
              ${!day.isCurrentMonth ? 'opacity-50' : ''}
              ${day.hasActivity ? 'shadow-lg shadow-green-500/25' : ''}
            `}
            onClick={() => handleDateClick(day)}
          >
            <div className="text-sm font-medium">{day.date.getDate()}</div>
            {day.hasActivity && (
              <div className="text-xs text-white font-bold">●</div>
            )}
          </div>
        ))}
      </div>

      {/* Activity Popup */}
      {showPopup && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="theme-card max-w-lg w-full max-h-[80vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-700">
              <h4 className="text-lg font-semibold text-white">
                {selectedDate.date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h4>
              <button
                onClick={closePopup}
                className="text-slate-400 hover:text-white transition-colors text-xl font-bold"
              >
                ✕
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-4">
              {selectedDate.activities.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-slate-300 text-sm mb-4">
                    {selectedDate.activities.length} activit{selectedDate.activities.length === 1 ? 'y' : 'ies'} recorded
                  </p>
                  
                  {/* Activities */}
                  {selectedDate.activities
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // Sort by newest first
                    .map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors">
                      <span className="text-lg">{getActivityIcon(activity.type)}</span>
                      <div className="flex-1">
                        <div className={`font-medium ${getActivityColor(activity.type)}`}>
                          {activity.type.replace('_', ' ').toUpperCase()}
                        </div>
                        {activity.details && (
                          <div className="text-sm text-slate-400">{activity.details}</div>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  
                  {/* History Section */}
                  {(() => {
                    const dateString = selectedDate.dateString;
                    const historyForDate = historyService.getHistoryForDate(dateString);
                    
                    if (historyForDate.length > 0) {
                      return (
                        <div className="mt-6 pt-4 border-t border-slate-600">
                          <h5 className="text-sm font-medium text-slate-300 mb-3">📚 History for this day:</h5>
                          <div className="space-y-2">
                            {historyForDate.map((historyItem, index) => (
                              <div key={index} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
                                <span className="text-sm">
                                  {historyItem.type === 'text' ? <FileText className="h-4 w-4" /> : <Palette className="h-4 w-4" />}
                                </span>
                                <div className="flex-1">
                                  <div className="text-xs text-slate-300">
                                    {historyItem.type === 'text' ? 'Text Edit' : 'Drawing Action'}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {historyItem.type === 'text' 
                                      ? `${historyItem.contentLength} characters - ${historyItem.preview}`
                                      : historyItem.details
                                    }
                                  </div>
                                </div>
                                <div className="text-xs text-slate-500">
                                  {new Date(historyItem.timestamp).toLocaleTimeString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">😴</div>
                  <p className="text-slate-400">No activity recorded for this day</p>
                </div>
              )}
            </div>
            
             {/* Fixed Footer */}
             <div className="p-6 pt-4 border-t border-slate-700">
               <div className="flex gap-2">
                 <button
                   onClick={closePopup}
                   className="w-full bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
                 >
                   Close
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
        <h5 className="text-sm font-medium text-slate-300 mb-3">Legend:</h5>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-slate-300">Active day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-slate-300">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-700 rounded"></div>
            <span className="text-slate-300">Inactive day</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityCalendar;