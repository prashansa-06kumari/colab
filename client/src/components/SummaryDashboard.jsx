import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, TrendingUp, Target, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AnalyticsCards from './AnalyticsCards';
import TimeframeToggle from './TimeframeToggle';
import ActivityChart from './ActivityChart';
import InsightsModal from './InsightsModal';
import analyticsService from '../services/analyticsService';

const SummaryDashboard = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState('weekly');
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartType, setChartType] = useState('line');

  // Initialize analytics service
  useEffect(() => {
    if (user?.id) {
      analyticsService.initialize(user.id);
      // Check for daily reset
      analyticsService.checkAndResetDailyCounters();
    }
  }, [user]);

  // Load summary data when timeframe changes
  useEffect(() => {
    loadSummaryData();
  }, [timeframe, user]);

  // Listen for daily reset events
  useEffect(() => {
    const handleDailyReset = () => {
      console.log('📅 Daily reset detected, reloading analytics');
      loadSummaryData();
    };

    window.addEventListener('dailyReset', handleDailyReset);
    return () => window.removeEventListener('dailyReset', handleDailyReset);
  }, []);

  const loadSummaryData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const data = await analyticsService.getSummaryData(timeframe);
      setSummaryData(data);
    } catch (error) {
      console.error('Error loading summary data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  const handleCardClick = async (metricType) => {
    if (!summaryData) return;
    
    setSelectedMetric(metricType);
    
    // Get detailed breakdown for the selected metric
    let detailedData = {};
    
    switch (metricType) {
      case 'points':
        detailedData = {
          totalPointsGiven: summaryData.totalPointsGiven,
          totalPointsReceived: summaryData.totalPointsReceived,
          averagePointsPerDay: Math.round(((summaryData.totalPointsGiven + summaryData.totalPointsReceived) / summaryData.dailyData.length) * 10) / 10,
          pointsGivenBreakdown: analyticsService.getDetailedBreakdown(summaryData.activities, 'points_given'),
          pointsReceivedBreakdown: analyticsService.getDetailedBreakdown(summaryData.activities, 'points_received'),
          dailyPointsData: summaryData.dailyData.map(day => ({
            date: day.date.toLocaleDateString(),
            pointsGiven: day.points || 0,
            pointsReceived: 0 // This would need to be calculated from activities
          }))
        };
        break;
      case 'activity':
        detailedData = {
          totalActivities: summaryData.totalActivities,
          averageActivityPerDay: summaryData.averageActivityPerDay,
          consistencyScore: Math.round((summaryData.dailyData.filter(day => day.activities > 0).length / summaryData.dailyData.length) * 100),
          activityTypes: analyticsService.getDetailedBreakdown(summaryData.activities, 'activity_types')
        };
        break;
      case 'streak':
        detailedData = {
          streakDays: summaryData.streakDays,
          bestStreak: summaryData.streakDays, // This would need to be calculated from historical data
          streakHistory: summaryData.dailyData
            .filter(day => day.activities > 0)
            .slice(-7) // Last 7 active days
            .map(day => ({
              date: day.date.toLocaleDateString(),
              activities: day.activities
            }))
        };
        break;
    }
    
    setSelectedMetric({ type: metricType, data: detailedData });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMetric(null);
  };


  const toggleChartType = () => {
    setChartType(prev => prev === 'line' ? 'bar' : 'line');
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 dark:shadow-2xl dark:shadow-blue-500/10 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500 dark:border-gray-600 dark:border-t-blue-400"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400 animate-pulse">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 dark:shadow-2xl dark:shadow-blue-500/10 p-8">
        <div className="text-center">
          <div className="mb-4">
            <BarChart3 className="h-16 w-16 text-blue-400 animate-bounce mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 animate-pulse">
            No Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start using the app to see your analytics here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 dark:shadow-2xl dark:shadow-blue-500/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-400 animate-bounce" />
              Analytics Dashboard
            </div>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1 animate-pulse">
            Track your engagement and progress over time
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleChartType}
            className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-300 hover:scale-105 hover:rotate-1 hover:animate-pulse"
          >
            <div className="flex items-center gap-2">
              {chartType === 'line' ? (
                <>
                  <BarChart3 className="h-4 w-4" />
                  Bar Chart
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Line Chart
                </>
              )}
            </div>
          </button>
          
          <button
            onClick={loadSummaryData}
            className="px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-300 hover:scale-110 hover:rotate-2 hover:animate-bounce"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 animate-spin" />
              Refresh
            </div>
          </button>
        </div>
      </div>

      {/* Timeframe Toggle and Reset Button */}
      <div className="flex justify-between items-center mb-6">
        <TimeframeToggle
          timeframe={timeframe}
          onTimeframeChange={handleTimeframeChange}
          isLoading={isLoading}
        />
        
      </div>

      {/* Analytics Cards */}
      <AnalyticsCards
        totalPointsGiven={summaryData.totalPointsGiven}
        totalPointsReceived={summaryData.totalPointsReceived}
        averageActivityPerDay={summaryData.averageActivityPerDay}
        streakDays={summaryData.streakDays}
        onCardClick={handleCardClick}
      />

      {/* Activity Chart */}
      {summaryData.dailyData && summaryData.dailyData.length > 0 && (
        <ActivityChart 
          dailyData={summaryData.dailyData}
          chartType={chartType}
        />
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-gradient-to-br dark:from-blue-900/30 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700/50 hover:scale-105 transition-all duration-300 hover:shadow-lg dark:hover:shadow-blue-500/20">
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-8 w-8 text-green-500 animate-pulse hover:animate-bounce transition-all duration-300" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Total Activities
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform duration-300">
                {summaryData.totalActivities}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-gradient-to-br dark:from-green-900/30 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-700/50 hover:scale-105 transition-all duration-300 hover:shadow-lg dark:hover:shadow-green-500/20">
          <div className="flex items-center space-x-3">
            <Target className="h-8 w-8 text-orange-500 animate-bounce hover:animate-pulse transition-all duration-300" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Active Days
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 hover:scale-110 transition-transform duration-300">
                {summaryData.dailyData.filter(day => day.activities > 0).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-gradient-to-br dark:from-purple-900/30 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700/50 hover:scale-105 transition-all duration-300 hover:shadow-lg dark:hover:shadow-purple-500/20">
          <div className="flex items-center space-x-3">
            <div className="text-2xl animate-pulse hover:animate-bounce transition-all duration-300">⚡</div>
            <div>
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                Consistency
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 hover:scale-110 transition-transform duration-300">
                {Math.round((summaryData.dailyData.filter(day => day.activities > 0).length / summaryData.dailyData.length) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Modal */}
      <InsightsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        metricType={selectedMetric?.type}
        data={selectedMetric?.data}
        timeframe={timeframe}
      />
    </div>
  );
};

export default SummaryDashboard;
