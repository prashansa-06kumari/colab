/**
 * Activity Service
 * Handles activity tracking and persistence
 */

class ActivityService {
  constructor() {
    this.userId = null;
  }

  // Initialize with user ID
  initialize(userId) {
    this.userId = userId;
    // Clean up any existing duplicate logins and logouts
    this.cleanupDuplicateLogins();
    this.cleanupDuplicateLogouts();
  }

  // Record a new activity
  async recordActivity(activityType, details = '') {
    if (!this.userId) {
      console.warn('ActivityService not initialized with user ID');
      return;
    }

    // Get today's date in YYYY-MM-DD format, ensuring consistent timezone
    const now = new Date();
    const today = now.getFullYear() + '-' + 
                  String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(now.getDate()).padStart(2, '0');
    
    console.log('📅 Activity Service - Recording activity for date:', today);
    console.log('📅 Current time:', now.toLocaleString());
    
    const newActivity = {
      type: activityType,
      timestamp: new Date().toISOString(),
      details: details
    };

    try {
      // Save to database first
      const token = sessionStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('/api/activity/record', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              type: activityType,
              details: details
            })
          });

          if (response.ok) {
            console.log('✅ Activity saved to database');
          } else {
            console.warn('⚠️ Failed to save activity to database, using localStorage fallback');
          }
        } catch (dbError) {
          console.warn('⚠️ Database save failed, using localStorage fallback:', dbError);
        }
      }

      // Also save to localStorage as backup
      const stored = localStorage.getItem(`activityData_${this.userId}`);
      const activityData = stored ? JSON.parse(stored) : {};

      // Check for duplicate login activities on the same day
      // Allow multiple logins per day (for logout/login cycles)
      // Only prevent duplicate logins within the same session
      if (activityType === 'login') {
        const todayActivities = activityData[today] || [];
        const recentLogin = todayActivities.find(activity => 
          activity.type === 'login' && 
          (new Date() - new Date(activity.timestamp)) < 5000 // Within 5 seconds
        );
        
        if (recentLogin) {
          console.log('🔑 Recent login detected, skipping duplicate');
          return false;
        }
      }

      // Add new activity to localStorage
      activityData[today] = [...(activityData[today] || []), newActivity];
      localStorage.setItem(`activityData_${this.userId}`, JSON.stringify(activityData));

      // Dispatch event for components to update
      window.dispatchEvent(new CustomEvent('activityUpdated', {
        detail: { activityType, details, date: today }
      }));

      console.log('✅ Activity recorded:', activityType, details);
      return true;
    } catch (error) {
      console.error('❌ Error recording activity:', error);
      return false;
    }
  }

  // Get activities for a specific date
  getActivitiesForDate(date) {
    if (!this.userId) return [];

    try {
      const stored = localStorage.getItem(`activityData_${this.userId}`);
      const activityData = stored ? JSON.parse(stored) : {};
      return activityData[date] || [];
    } catch (error) {
      console.error('❌ Error getting activities:', error);
      return [];
    }
  }

  // Get all activity data
  getAllActivities() {
    if (!this.userId) return {};

    try {
      const stored = localStorage.getItem(`activityData_${this.userId}`);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('❌ Error getting all activities:', error);
      return {};
    }
  }

  // Clear all activities (for testing)
  clearAllActivities() {
    if (!this.userId) return;

    try {
      localStorage.removeItem(`activityData_${this.userId}`);
      window.dispatchEvent(new CustomEvent('activityUpdated'));
      console.log('🗑️ All activities cleared');
    } catch (error) {
      console.error('❌ Error clearing activities:', error);
    }
  }

  // Clean up duplicate login activities
  cleanupDuplicateLogins() {
    if (!this.userId) return;

    try {
      const stored = localStorage.getItem(`activityData_${this.userId}`);
      if (!stored) return;

      const activityData = JSON.parse(stored);
      // Get today's date in YYYY-MM-DD format, ensuring consistent timezone
    const now = new Date();
    const today = now.getFullYear() + '-' + 
                  String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(now.getDate()).padStart(2, '0');
      const todayActivities = activityData[today] || [];

      // Filter out duplicate login activities, keeping only the first one
      const loginActivities = todayActivities.filter(activity => activity.type === 'login');
      const otherActivities = todayActivities.filter(activity => activity.type !== 'login');

      if (loginActivities.length > 1) {
        // Keep only the first login activity
        const firstLogin = loginActivities[0];
        activityData[today] = [firstLogin, ...otherActivities];
        
        localStorage.setItem(`activityData_${this.userId}`, JSON.stringify(activityData));
        console.log('🧹 Cleaned up duplicate login activities');
      }
    } catch (error) {
      console.error('❌ Error cleaning up duplicate logins:', error);
    }
  }

  // Clean up duplicate logout activities
  cleanupDuplicateLogouts() {
    if (!this.userId) return;

    try {
      const stored = localStorage.getItem(`activityData_${this.userId}`);
      if (!stored) return;

      const activityData = JSON.parse(stored);
      // Get today's date in YYYY-MM-DD format, ensuring consistent timezone
    const now = new Date();
    const today = now.getFullYear() + '-' + 
                  String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(now.getDate()).padStart(2, '0');
      const todayActivities = activityData[today] || [];

      // Filter out duplicate logout activities, keeping only the last one
      const logoutActivities = todayActivities.filter(activity => activity.type === 'logout');
      const otherActivities = todayActivities.filter(activity => activity.type !== 'logout');

      if (logoutActivities.length > 1) {
        // Keep only the last logout activity
        const lastLogout = logoutActivities[logoutActivities.length - 1];
        activityData[today] = [...otherActivities, lastLogout];
        
        localStorage.setItem(`activityData_${this.userId}`, JSON.stringify(activityData));
        console.log('🧹 Cleaned up duplicate logout activities');
      }
    } catch (error) {
      console.error('❌ Error cleaning up duplicate logouts:', error);
    }
  }

  // Get activity statistics
  getActivityStats() {
    const activities = this.getAllActivities();
    const dates = Object.keys(activities).sort();
    
    return {
      totalDays: dates.length,
      currentStreak: this.calculateCurrentStreak(dates),
      longestStreak: this.calculateLongestStreak(dates),
      lastActiveDate: dates.length > 0 ? dates[dates.length - 1] : null
    };
  }

  // Calculate current streak
  calculateCurrentStreak(dates) {
    if (dates.length === 0) return 0;
    
    // Get today's date in YYYY-MM-DD format, ensuring consistent timezone
    const now = new Date();
    const today = now.getFullYear() + '-' + 
                  String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(now.getDate()).padStart(2, '0');
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
  }

  // Calculate longest streak
  calculateLongestStreak(dates) {
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
  }
}

// Create singleton instance
const activityService = new ActivityService();

export default activityService;
