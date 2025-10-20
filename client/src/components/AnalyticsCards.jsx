import React from 'react';
import { TrendingUp, Calendar, Flame, Coins } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const AnalyticsCards = ({ 
  totalPointsGiven, 
  totalPointsReceived,
  averageActivityPerDay, 
  streakDays, 
  onCardClick 
}) => {
  const { isDark } = useTheme();

  const cards = [
    {
      id: 'points',
      title: 'Points Today',
      value: `${totalPointsGiven} given • ${totalPointsReceived} received`,
      icon: Coins,
      color: 'from-blue-500 to-purple-600',
      bgColor: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
      borderColor: isDark ? 'border-blue-500/30' : 'border-blue-200',
      description: 'Points given and received today (resets daily)'
    },
    {
      id: 'activity',
      title: 'Avg Activity/Day',
      value: averageActivityPerDay,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600',
      bgColor: isDark ? 'bg-green-900/20' : 'bg-green-50',
      borderColor: isDark ? 'border-green-500/30' : 'border-green-200',
      description: 'Daily engagement average'
    },
    {
      id: 'streak',
      title: 'Streak Days',
      value: streakDays,
      icon: Flame,
      color: 'from-orange-500 to-red-600',
      bgColor: isDark ? 'bg-orange-900/20' : 'bg-orange-50',
      borderColor: isDark ? 'border-orange-500/30' : 'border-orange-200',
      description: 'Consecutive active days'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {cards.map((card) => (
        <div
          key={card.id}
          onClick={() => onCardClick(card.id)}
          className={`
            relative overflow-hidden rounded-xl p-6 cursor-pointer
            ${card.bgColor} ${card.borderColor}
            border transition-all duration-700 hover:scale-115 hover:shadow-2xl hover:rotate-2
            group hover:animate-pulse hover:bg-gradient-to-br hover:from-white/5 hover:to-transparent
            dark:shadow-2xl dark:shadow-blue-500/10
          `}
        >
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
          
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${card.color} text-white shadow-lg group-hover:animate-bounce group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                <card.icon className="h-8 w-8" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 group-hover:animate-pulse group-hover:scale-105 transition-all duration-300">
                  {card.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-300">
                  {card.description}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:scale-105 transition-transform duration-300">
                {card.title}
              </h3>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-300">
                <TrendingUp className="h-4 w-4 mr-2 group-hover:animate-bounce" />
                <span className="group-hover:font-semibold transition-all duration-300">Click for details</span>
                <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Hover effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </div>
      ))}
    </div>
  );
};

export default AnalyticsCards;
