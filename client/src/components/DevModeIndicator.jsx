/**
 * DevModeIndicator Component
 * Shows development mode status and testing helpers
 */

import React, { useState } from 'react';

const DevModeIndicator = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-yellow-800">DEV MODE</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-yellow-600 hover:text-yellow-800 text-xs"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
        
        {isExpanded && (
          <div className="mt-2 text-xs text-yellow-700 space-y-1">
            <p>• Each tab has isolated sessions</p>
            <p>• Use "Switch User" to test different users</p>
            <p>• Open multiple tabs for real-time testing</p>
            <p>• SessionStorage provides tab isolation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevModeIndicator;
