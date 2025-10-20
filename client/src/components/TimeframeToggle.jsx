import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const TimeframeToggle = ({ timeframe, onTimeframeChange, isLoading = false }) => {
  const { isDark } = useTheme();

  const options = [
    { value: 'weekly', label: 'Weekly', icon: '📅' },
    { value: 'monthly', label: 'Monthly', icon: '📊' }
  ];

  return (
    <div className="flex items-center space-x-2 mb-6">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        View:
      </span>
      
      <div className={`
        relative inline-flex rounded-lg p-1
        ${isDark ? 'bg-gray-800' : 'bg-gray-100'}
        border ${isDark ? 'border-gray-700' : 'border-gray-200'}
        transition-all duration-300
      `}>
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onTimeframeChange(option.value)}
            disabled={isLoading}
            className={`
              relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-300
              flex items-center space-x-2 min-w-[100px] justify-center
              ${timeframe === option.value
                ? `bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm border ${isDark ? 'border-gray-600' : 'border-gray-200'}`
                : `text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50`
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="text-lg">{option.icon}</span>
            <span>{option.label}</span>
            
            {timeframe === option.value && (
              <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse" />
            )}
          </button>
        ))}
      </div>
      
      {isLoading && (
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-500"></div>
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
};

export default TimeframeToggle;
