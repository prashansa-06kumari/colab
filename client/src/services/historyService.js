/**
 * History Service
 * Tracks and manages history of text editor and drawing board changes
 */

class HistoryService {
  constructor() {
    this.userId = null;
    this.textHistory = [];
    this.drawingHistory = [];
  }

  // Initialize with user ID
  initialize(userId) {
    this.userId = userId;
    this.loadHistory();
    // Clean up any existing duplicate text changes
    this.cleanupDuplicateTextChanges();
  }

  // Load history from localStorage
  loadHistory() {
    if (!this.userId) return;

    try {
      const textHistory = localStorage.getItem(`textHistory_${this.userId}`);
      const drawingHistory = localStorage.getItem(`drawingHistory_${this.userId}`);
      
      this.textHistory = textHistory ? JSON.parse(textHistory) : [];
      this.drawingHistory = drawingHistory ? JSON.parse(drawingHistory) : [];
    } catch (error) {
      console.error('Error loading history:', error);
      this.textHistory = [];
      this.drawingHistory = [];
    }
  }

  // Save history to localStorage
  saveHistory() {
    if (!this.userId) return;

    try {
      localStorage.setItem(`textHistory_${this.userId}`, JSON.stringify(this.textHistory));
      localStorage.setItem(`drawingHistory_${this.userId}`, JSON.stringify(this.drawingHistory));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }

  // Add text change to history
  async addTextChange(content, changeType = 'edit') {
    if (!this.userId) return;

    // Check for duplicate content (same content within 10 seconds)
    const now = new Date();
    const recentEntry = this.textHistory.find(entry => {
      const entryTime = new Date(entry.timestamp);
      const timeDiff = (now - entryTime) / 1000; // seconds
      return entry.content === content && timeDiff < 10;
    });

    if (recentEntry) {
      console.log('📝 Duplicate text change detected, skipping');
      return;
    }

    const historyEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: 'text',
      changeType: changeType,
      content: content,
      contentLength: content.length,
      preview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
    };

    // Save to database first
    const token = sessionStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('/api/history/record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            type: 'text',
            changeType: changeType,
            content: content,
            contentLength: content.length,
            preview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
            details: `Text ${changeType} - ${content.length} characters`
          })
        });

        if (response.ok) {
          console.log('✅ Text history saved to database');
        } else {
          console.warn('⚠️ Failed to save text history to database, using localStorage fallback');
        }
      } catch (dbError) {
        console.warn('⚠️ Database save failed, using localStorage fallback:', dbError);
      }
    }

    this.textHistory.push(historyEntry);
    
    // Keep only last 50 text changes
    if (this.textHistory.length > 50) {
      this.textHistory = this.textHistory.slice(-50);
    }

    this.saveHistory();
    this.dispatchHistoryUpdate();
    
    console.log('📝 Text history updated:', historyEntry);
  }

  // Add drawing change to history
  async addDrawingChange(action, details = '') {
    if (!this.userId) return;

    const historyEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: 'drawing',
      action: action,
      details: details
    };

    // Save to database first
    const token = sessionStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('/api/history/record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            type: 'drawing',
            changeType: action,
            content: '',
            contentLength: 0,
            preview: '',
            details: details
          })
        });

        if (response.ok) {
          console.log('✅ Drawing history saved to database');
        } else {
          console.warn('⚠️ Failed to save drawing history to database, using localStorage fallback');
        }
      } catch (dbError) {
        console.warn('⚠️ Database save failed, using localStorage fallback:', dbError);
      }
    }

    this.drawingHistory.push(historyEntry);
    
    // Keep only last 50 drawing changes
    if (this.drawingHistory.length > 50) {
      this.drawingHistory = this.drawingHistory.slice(-50);
    }

    this.saveHistory();
    this.dispatchHistoryUpdate();
    
    console.log('🎨 Drawing history updated:', historyEntry);
  }

  // Get text history
  getTextHistory() {
    return this.textHistory;
  }

  // Get drawing history
  getDrawingHistory() {
    return this.drawingHistory;
  }

  // Get all history (combined and sorted by timestamp)
  getAllHistory() {
    const allHistory = [...this.textHistory, ...this.drawingHistory];
    return allHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Get history for a specific date
  getHistoryForDate(date) {
    // Get date in YYYY-MM-DD format, ensuring consistent timezone
    const dateObj = new Date(date);
    const targetDate = dateObj.getFullYear() + '-' + 
                       String(dateObj.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(dateObj.getDate()).padStart(2, '0');
    
    const textForDate = this.textHistory.filter(entry => 
      entry.timestamp.split('T')[0] === targetDate
    );
    
    const drawingForDate = this.drawingHistory.filter(entry => 
      entry.timestamp.split('T')[0] === targetDate
    );
    
    return [...textForDate, ...drawingForDate].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  // Clear all history
  clearHistory() {
    this.textHistory = [];
    this.drawingHistory = [];
    this.saveHistory();
    this.dispatchHistoryUpdate();
    console.log('🗑️ History cleared');
  }

  // Clean up duplicate text changes
  cleanupDuplicateTextChanges() {
    if (!this.userId) return;

    try {
      // Remove duplicate text changes (same content within 30 seconds)
      const cleanedHistory = [];
      const seen = new Set();

      this.textHistory.forEach(entry => {
        const key = `${entry.content}_${Math.floor(new Date(entry.timestamp).getTime() / 30000)}`; // 30-second windows
        if (!seen.has(key)) {
          seen.add(key);
          cleanedHistory.push(entry);
        }
      });

      if (cleanedHistory.length !== this.textHistory.length) {
        this.textHistory = cleanedHistory;
        this.saveHistory();
        console.log('🧹 Cleaned up duplicate text changes');
      }
    } catch (error) {
      console.error('❌ Error cleaning up duplicate text changes:', error);
    }
  }

  // Dispatch history update event
  dispatchHistoryUpdate() {
    window.dispatchEvent(new CustomEvent('historyUpdated'));
  }

  // Get history statistics
  getHistoryStats() {
    // Get today's date in YYYY-MM-DD format, ensuring consistent timezone
    const now = new Date();
    const today = now.getFullYear() + '-' + 
                  String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(now.getDate()).padStart(2, '0');
    const todayText = this.textHistory.filter(entry => 
      entry.timestamp.split('T')[0] === today
    ).length;
    const todayDrawing = this.drawingHistory.filter(entry => 
      entry.timestamp.split('T')[0] === today
    ).length;

    return {
      totalTextChanges: this.textHistory.length,
      totalDrawingChanges: this.drawingHistory.length,
      todayTextChanges: todayText,
      todayDrawingChanges: todayDrawing,
      lastTextChange: this.textHistory[this.textHistory.length - 1]?.timestamp || null,
      lastDrawingChange: this.drawingHistory[this.drawingHistory.length - 1]?.timestamp || null
    };
  }
}

// Create singleton instance
const historyService = new HistoryService();

export default historyService;
