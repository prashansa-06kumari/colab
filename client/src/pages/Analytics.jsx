import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SummaryDashboard from '../components/SummaryDashboard';

const Analytics = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-white animate-pulse mx-auto mb-4" />
          <p className="text-white text-lg">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Back Button */}
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-all duration-200 border border-slate-600/50 w-fit hover:scale-105"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </Link>
              
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 lg:mb-2 flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-blue-400" />
                  Analytics Dashboard
                </h1>
                <p className="text-slate-300 text-sm lg:text-base">
                  Track your engagement, points activity, and daily progress
                </p>
              </div>
            </div>
            <div className="text-left lg:text-right">
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <User className="h-4 w-4" />
                Welcome back,
              </p>
              <p className="text-lg font-semibold text-white">{user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SummaryDashboard />
      </div>
    </div>
  );
};

export default Analytics;
