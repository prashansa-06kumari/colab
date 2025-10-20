/**
 * Analytics Service
 * Handles calculation of user engagement metrics and summary data
 */

class AnalyticsService {
  constructor() {
    this.userId = null;
    this.cache = new Map(); // Cache for computed summaries
  }

  // Initialize with user ID
  initialize(userId) {
    this.userId = userId;
    this.loadCache();
    
    // Check and reset daily counters on initialization
    this.checkAndResetDailyCounters();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  // Load cache from localStorage
  loadCache() {
    if (!this.userId) return;
    
    try {
      const cached = localStorage.getItem(`analytics_cache_${this.userId}`);
      if (cached) {
        this.cache = new Map(JSON.parse(cached));
      }
    } catch (error) {
      console.error('Error loading analytics cache:', error);
      this.cache = new Map();
    }
  }

  // Save cache to localStorage
  saveCache() {
    if (!this.userId) return;
    
    try {
      localStorage.setItem(`analytics_cache_${this.userId}`, JSON.stringify([...this.cache]));
    } catch (error) {
      console.error('Error saving analytics cache:', error);
    }
  }

  // Setup event listeners for real-time updates
  setupEventListeners() {
    // Listen for new activities to invalidate cache
    window.addEventListener('activityUpdated', () => {
      console.log('📊 Analytics: Activity updated, invalidating cache');
      this.invalidateCache();
    });

    // Listen for streak updates
    window.addEventListener('streakUpdated', () => {
      console.log('📊 Analytics: Streak updated, invalidating cache');
      this.invalidateCache();
    });
  }

  // Invalidate cache to force fresh data
  invalidateCache() {
    this.cache.clear();
    this.saveCache();
  }

  // Get date range for timeframe
  getDateRange(timeframe) {
    const now = new Date();
    const start = new Date(now);
    
    if (timeframe === 'weekly') {
      // Start of current week (Monday)
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start.setDate(now.getDate() - daysToMonday);
      start.setHours(0, 0, 0, 0);
    } else if (timeframe === 'monthly') {
      // Start of current month
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    }
    
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }

  // Get activities for date range
  async getActivitiesForRange(timeframe) {
    const { start, end } = this.getDateRange(timeframe);
    const cacheKey = `activities_${timeframe}_${start.toISOString()}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (new Date(cached.timestamp) > new Date(start)) {
        return cached.data;
      }
    }

    try {
      // Try to fetch from database first
      const token = sessionStorage.getItem('token');
      if (token) {
        const response = await fetch(`/api/activity/all?start=${start.toISOString()}&end=${end.toISOString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const result = await response.json();
          const activities = result.data || [];
          
          // Cache the result
          this.cache.set(cacheKey, {
            data: activities,
            timestamp: new Date().toISOString()
          });
          this.saveCache();
          
          return activities;
        }
      }
    } catch (error) {
      console.warn('Database fetch failed, using localStorage fallback:', error);
    }

    // Fallback to localStorage
    const activities = this.getActivitiesFromLocalStorage(start, end);
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: activities,
      timestamp: new Date().toISOString()
    });
    this.saveCache();
    
    return activities;
  }

  // Get activities from localStorage
  getActivitiesFromLocalStorage(start, end) {
    if (!this.userId) return [];
    
    try {
      const stored = localStorage.getItem(`activityData_${this.userId}`);
      if (!stored) return [];
      
      const activityData = JSON.parse(stored);
      const activities = [];
      
      // Get all dates in range
      const current = new Date(start);
      while (current <= end) {
        // Use consistent date formatting
        const dateString = current.getFullYear() + '-' + 
                           String(current.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(current.getDate()).padStart(2, '0');
        const dayActivities = activityData[dateString] || [];
        
        console.log('📊 Analytics - Checking date:', dateString, 'Activities:', dayActivities.length);
        
        dayActivities.forEach(activity => {
          const activityDate = new Date(activity.timestamp);
          if (activityDate >= start && activityDate <= end) {
            activities.push(activity);
            console.log('📊 Analytics - Added activity:', activity.type, activity.details);
          }
        });
        
        current.setDate(current.getDate() + 1);
      }
      
      return activities;
    } catch (error) {
      console.error('Error getting activities from localStorage:', error);
      return [];
    }
  }

  // Calculate total points given
  calculateTotalPointsGiven(activities) {
    console.log('📊 Analytics - Calculating points given from activities:', activities.length);
    
    const pointsGivenActivities = activities.filter(activity => activity.type === 'points_given');
    console.log('📊 Analytics - Points given activities:', pointsGivenActivities);
    
    const total = pointsGivenActivities.reduce((total, activity) => {
      // Extract points from details (e.g., "Gave 5 points to User B" -> 5)
      const pointsMatch = activity.details.match(/(\d+)\s+points/);
      const points = pointsMatch ? parseInt(pointsMatch[1]) : 0;
      console.log('📊 Analytics - Activity details:', activity.details, 'Points extracted:', points);
      return total + points;
    }, 0);
    
    console.log('📊 Analytics - Total points given calculated:', total);
    return total;
  }

  // Calculate average activity per day
  calculateAverageActivityPerDay(activities, timeframe) {
    const { start, end } = this.getDateRange(timeframe);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalActivities = activities.length;
    
    return daysDiff > 0 ? Math.round((totalActivities / daysDiff) * 10) / 10 : 0;
  }

  // Calculate streak days
  calculateStreakDays(activities) {
    if (!this.userId) return 0;
    
    try {
      const stored = localStorage.getItem(`activityData_${this.userId}`);
      if (!stored) return 0;
      
      const activityData = JSON.parse(stored);
      const dates = Object.keys(activityData).sort();
      
      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      
      // Count consecutive days from today backwards
      for (let i = dates.length - 1; i >= 0; i--) {
        const date = dates[i];
        const dayActivities = activityData[date];
        
        if (dayActivities && dayActivities.length > 0) {
          streak++;
        } else {
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak days:', error);
      return 0;
    }
  }

  // Get daily activity data for charts
  getDailyActivityData(activities, timeframe) {
    const { start, end } = this.getDateRange(timeframe);
    const dailyData = {};
    
    // Initialize all days in range
    const current = new Date(start);
    while (current <= end) {
      const dateString = current.toISOString().split('T')[0];
      dailyData[dateString] = {
        date: new Date(current),
        activities: 0,
        points: 0
      };
      current.setDate(current.getDate() + 1);
    }
    
    // Count activities per day
    activities.forEach(activity => {
      const dateString = new Date(activity.timestamp).toISOString().split('T')[0];
      if (dailyData[dateString]) {
        dailyData[dateString].activities++;
        
        if (activity.type === 'points_given') {
          const pointsMatch = activity.details.match(/(\d+)\s+points/);
          if (pointsMatch) {
            dailyData[dateString].points += parseInt(pointsMatch[1]);
          }
        }
      }
    });
    
    return Object.values(dailyData).sort((a, b) => a.date - b.date);
  }

  // Get summary data for timeframe
  async getSummaryData(timeframe) {
    // Always check for daily reset first
    this.checkAndResetDailyCounters();
    
    const activities = await this.getActivitiesForRange(timeframe);
    
    // FORCE USE DAILY COUNTERS ONLY - IGNORE OLD ACTIVITY DATA
    const totalPointsGiven = this.getDailyPointsGiven();
    const totalPointsReceived = this.getDailyPointsReceived();
    
    // For other metrics, use activities but NOT for points
    const averageActivityPerDay = this.calculateAverageActivityPerDay(activities, timeframe);
    const streakDays = this.calculateStreakDays(activities);
    const dailyData = this.getDailyActivityData(activities, timeframe);
    
    console.log('📊 FORCED DAILY COUNTERS:', {
      pointsGiven: totalPointsGiven,
      pointsReceived: totalPointsReceived,
      timeframe,
      lastResetDate: localStorage.getItem(`lastResetDate_${this.userId}`),
      today: new Date().toISOString().split('T')[0],
      userId: this.userId
    });
    
    return {
      timeframe,
      totalPointsGiven,
      totalPointsReceived,
      averageActivityPerDay,
      streakDays,
      totalActivities: activities.length,
      dailyData,
      activities
    };
  }

  // Get detailed breakdown for a specific metric
  getDetailedBreakdown(activities, metricType) {
    switch (metricType) {
      case 'points_given':
        return activities
          .filter(activity => activity.type === 'points_given')
          .map(activity => ({
            timestamp: activity.timestamp,
            details: activity.details,
            points: this.extractPointsFromDetails(activity.details)
          }));
      
      case 'activity_types':
        const typeCounts = {};
        activities.forEach(activity => {
          typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;
        });
        return Object.entries(typeCounts)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count);
      
      default:
        return [];
    }
  }

  // Extract points from activity details
  extractPointsFromDetails(details) {
    const pointsMatch = details.match(/(\d+)\s+points/);
    return pointsMatch ? parseInt(pointsMatch[1]) : 0;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    if (this.userId) {
      localStorage.removeItem(`analytics_cache_${this.userId}`);
    }
  }

  // Check if it's a new day and reset daily counters
  checkAndResetDailyCounters() {
    if (!this.userId) return;
    
    const today = new Date();
    const todayString = today.getFullYear() + '-' + 
                       String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(today.getDate()).padStart(2, '0');
    
    const lastResetDate = localStorage.getItem(`lastResetDate_${this.userId}`);
    
    console.log('📅 Daily reset check:', {
      today: todayString,
      lastReset: lastResetDate,
      shouldReset: lastResetDate !== todayString,
      userId: this.userId
    });
    
    if (lastResetDate !== todayString) {
      console.log('📅 New day detected, resetting daily counters');
      
      // Reset daily points given and received counters
      localStorage.setItem(`dailyPointsGiven_${this.userId}`, '0');
      localStorage.setItem(`dailyPointsReceived_${this.userId}`, '0');
      localStorage.setItem(`lastResetDate_${this.userId}`, todayString);
      
      // Clear analytics cache for fresh calculations
      this.clearCache();
      
      // Dispatch event to notify components
      window.dispatchEvent(new CustomEvent('dailyReset', { 
        detail: { date: todayString } 
      }));
      
      console.log('✅ Daily reset completed');
    } else {
      console.log('📅 Same day, no reset needed');
    }
  }

  // Get daily points given (resets each day)
  getDailyPointsGiven() {
    if (!this.userId) return 0;
    
    this.checkAndResetDailyCounters();
    
    const dailyPoints = localStorage.getItem(`dailyPointsGiven_${this.userId}`);
    const result = dailyPoints ? parseInt(dailyPoints) : 0;
    
    console.log('📊 getDailyPointsGiven:', {
      userId: this.userId,
      rawValue: dailyPoints,
      parsedValue: result
    });
    
    return result;
  }

  // Add to daily points given
  addToDailyPointsGiven(points) {
    if (!this.userId) return;
    
    this.checkAndResetDailyCounters();
    
    const currentDaily = this.getDailyPointsGiven();
    const newTotal = currentDaily + points;
    localStorage.setItem(`dailyPointsGiven_${this.userId}`, newTotal.toString());
    
    console.log('📊 Daily points given updated:', newTotal);
  }

  // Get daily points received (resets each day)
  getDailyPointsReceived() {
    if (!this.userId) return 0;
    
    this.checkAndResetDailyCounters();
    
    const dailyPoints = localStorage.getItem(`dailyPointsReceived_${this.userId}`);
    const result = dailyPoints ? parseInt(dailyPoints) : 0;
    
    console.log('📊 getDailyPointsReceived:', {
      userId: this.userId,
      rawValue: dailyPoints,
      parsedValue: result
    });
    
    return result;
  }

  // Add to daily points received
  addToDailyPointsReceived(points) {
    if (!this.userId) return;
    
    this.checkAndResetDailyCounters();
    
    const currentDaily = this.getDailyPointsReceived();
    const newTotal = currentDaily + points;
    localStorage.setItem(`dailyPointsReceived_${this.userId}`, newTotal.toString());
    
    console.log('📊 Daily points received updated:', newTotal);
  }

  // Force daily reset (for testing)
  forceDailyReset() {
    if (!this.userId) return;
    
    console.log('🔄 Forcing daily reset');
    
    // Reset both counters to 0
    localStorage.setItem(`dailyPointsGiven_${this.userId}`, '0');
    localStorage.setItem(`dailyPointsReceived_${this.userId}`, '0');
    
    // Update last reset date to today
    const today = new Date();
    const todayString = today.getFullYear() + '-' + 
                       String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(today.getDate()).padStart(2, '0');
    localStorage.setItem(`lastResetDate_${this.userId}`, todayString);
    
    // Clear cache
    this.clearCache();
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('dailyReset', { 
      detail: { date: todayString } 
    }));
    
    console.log('✅ Daily reset completed - both counters set to 0');
    
    // Verify the reset worked
    const pointsGiven = localStorage.getItem(`dailyPointsGiven_${this.userId}`);
    const pointsReceived = localStorage.getItem(`dailyPointsReceived_${this.userId}`);
    console.log('🔍 Verification:', {
      pointsGiven: pointsGiven,
      pointsReceived: pointsReceived,
      lastReset: localStorage.getItem(`lastResetDate_${this.userId}`)
    });
  }

  // Clear all analytics data and start fresh
  clearAllAnalyticsData() {
    if (!this.userId) return;
    
    console.log('🗑️ Clearing ALL analytics data');
    
    // Remove all analytics-related localStorage items
    localStorage.removeItem(`dailyPointsGiven_${this.userId}`);
    localStorage.removeItem(`dailyPointsReceived_${this.userId}`);
    localStorage.removeItem(`lastResetDate_${this.userId}`);
    localStorage.removeItem(`analytics_cache_${this.userId}`);
    
    // Clear cache
    this.cache.clear();
    
    console.log('✅ All analytics data cleared');
  }
}

export default new AnalyticsService();
