/**
 * Streak Service
 * Handles automatic activity tracking for streak system
 */

class StreakService {
  constructor() {
    this.isTracking = false;
  }

  /**
   * Record user activity
   * @param {string} activityType - Type of activity
   * @param {string} details - Additional details
   */
  async recordActivity(activityType, details = '') {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/streak/activity', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activityType,
          details
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Activity recorded:', data);
        
        return data;
      }
    } catch (error) {
      console.error('Error recording activity:', error);
    }
  }

  /**
   * Show streak notification
   * @param {string} message - Notification message
   * @param {number} streak - Current streak count
   */
  showStreakNotification(message, streak) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-amber-500 to-gold-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-in';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-2xl">${streak === 1 ? '🌟' : '🔥'}</span>
        <div>
          <div class="font-bold">Day ${streak} Streak!</div>
          <div class="text-sm">${message}</div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
      notification.classList.add('animate-slide-out');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  /**
   * Track login activity
   */
  async trackLogin() {
    const result = await this.recordActivity('login', 'User logged in');
    return result;
  }

  /**
   * Track message activity
   * @param {string} messageText - The message content
   */
  trackMessage(messageText) {
    this.recordActivity('message', `Sent message: ${messageText.substring(0, 50)}...`);
  }

  /**
   * Track edit activity
   * @param {string} editType - Type of edit (text, drawing, etc.)
   */
  trackEdit(editType = 'text') {
    this.recordActivity('edit', `Edited ${editType}`);
  }

  /**
   * Track drawing activity
   * @param {string} drawingType - Type of drawing action
   */
  trackDrawing(drawingType = 'stroke') {
    this.recordActivity('drawing', `Drew ${drawingType}`);
  }

  /**
   * Track points given
   * @param {number} points - Points given
   * @param {string} recipient - Recipient name
   */
  trackPointsGiven(points, recipient) {
    this.recordActivity('points_given', `Gave ${points} points to ${recipient}`);
  }

  /**
   * Track points received
   * @param {number} points - Points received
   * @param {string} sender - Sender name
   */
  trackPointsReceived(points, sender) {
    this.recordActivity('points_received', `Received ${points} points from ${sender}`);
  }
}

const streakService = new StreakService();
export default streakService;
