import React from 'react';
import { X, Coins, Star, BarChart3, Calendar, Target, Flame, Trophy, TrendingUp, Download, Edit, Palette, Gift } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const InsightsModal = ({ isOpen, onClose, metricType, data, timeframe }) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const getModalTitle = () => {
    switch (metricType) {
      case 'points':
        return 'Points Today Breakdown';
      case 'activity':
        return 'Activity Analysis';
      case 'streak':
        return 'Streak Details';
      default:
        return 'Detailed Insights';
    }
  };

  const getModalContent = () => {
    switch (metricType) {
      case 'points':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                        <Coins className="h-5 w-5 text-blue-600" />
                        Points Given Today
                      </h4>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {data?.totalPointsGiven || 0}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Points sent today
                </p>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-600" />
                        Points Received Today
                      </h4>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {data?.totalPointsReceived || 0}
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Points received today
                </p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                        Total Points Today
                      </h4>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {(data?.totalPointsGiven || 0) + (data?.totalPointsReceived || 0)}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Combined activity
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-gray-600" />
                      Daily Points Summary
                    </h4>
              <div className="text-center py-4">
                <p className="text-lg text-gray-700 dark:text-gray-300">
                  Today you've given <span className="font-bold text-blue-600 dark:text-blue-400">{data?.totalPointsGiven || 0}</span> points
                </p>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                  and received <span className="font-bold text-yellow-600 dark:text-yellow-400">{data?.totalPointsReceived || 0}</span> points
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Both counters reset to 0 each new day
                </p>
              </div>
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Total Activities
                  </div>
                </h4>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {data?.totalActivities || 0}
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  This {timeframe}
                </p>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Daily Average
                  </div>
                </h4>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {data?.averageActivityPerDay || 0}
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Activities per day
                </p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-600" />
                    Consistency
                  </div>
                </h4>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {data?.consistencyScore || 0}%
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Active days
                </p>
              </div>
            </div>

            {data?.activityTypes && data.activityTypes.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Activity Types
                </h4>
                <div className="space-y-2">
                  {data.activityTypes.map((type, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">
                          {type.type === 'login' ? '🔑' : 
                           type.type === 'message' ? '💬' :
                           type.type === 'edit' ? '✏️' :
                           type.type === 'drawing' ? '🎨' :
                           type.type === 'points_given' ? '⭐' :
                           type.type === 'points_received' ? '🎁' :
                           type.type === 'download' ? '💾' : '📝'}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white capitalize">
                          {type.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {type.count}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          times
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'streak':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mb-4">
                <Flame className="h-16 w-16 text-orange-500 animate-pulse mx-auto" />
              </div>
              <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {data?.streakDays || 0} Day Streak!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You've been active for {data?.streakDays || 0} consecutive days
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-600" />
                    Current Streak
                  </div>
                </h4>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {data?.streakDays || 0} days
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Keep it up!
                </p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-600" />
                    Best Streak
                  </div>
                </h4>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {data?.bestStreak || 0} days
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Personal record
                </p>
              </div>
            </div>

            {data?.streakHistory && data.streakHistory.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Recent Activity
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {data.streakHistory.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {day.date}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {day.activities} activities
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <div className="mb-4">
              <BarChart3 className="h-16 w-16 text-blue-400 animate-bounce mx-auto" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              No detailed data available for this metric.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`
        bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 
        max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {getModalTitle()}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Detailed breakdown for {timeframe} period
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {getModalContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsightsModal;
