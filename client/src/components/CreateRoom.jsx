import React, { useState } from 'react';
import { X, Users, Lock, Unlock, Settings, Save } from 'lucide-react';
import api from '../services/api';

const CreateRoom = ({ onClose, onRoomCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    maxMembers: 10,
    settings: {
      allowGuests: false,
      requireApproval: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('settings.')) {
      const settingName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingName]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/rooms', formData);
      if (response.data.success) {
        onRoomCreated(response.data.data.room, response.data.data.joinLink);
        onClose();
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setError(error.response?.data?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-pink-600/20 to-purple-600/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                Create New Room
              </h2>
              <p className="text-sm text-slate-300 mt-1">Set up a collaborative workspace</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors text-xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Basic Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Room Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter room name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300 resize-none"
                placeholder="Describe what this room is for..."
              />
            </div>
          </div>

          {/* Room Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="h-5 w-5" />
              Room Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Members
                </label>
                <select
                  name="maxMembers"
                  value={formData.maxMembers}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300"
                >
                  <option value={5}>5 members</option>
                  <option value={10}>10 members</option>
                  <option value={20}>20 members</option>
                  <option value={50}>50 members</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPrivate"
                    checked={formData.isPrivate}
                    onChange={handleChange}
                    className="h-4 w-4 text-pink-600 bg-slate-700 border-slate-600 rounded focus:ring-pink-500 focus:ring-2"
                  />
                  <label className="ml-2 text-sm text-slate-300 flex items-center gap-2">
                    {formData.isPrivate ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    Private Room
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Advanced Settings</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="settings.allowGuests"
                  checked={formData.settings.allowGuests}
                  onChange={handleChange}
                  className="h-4 w-4 text-pink-600 bg-slate-700 border-slate-600 rounded focus:ring-pink-500 focus:ring-2"
                />
                <label className="ml-2 text-sm text-slate-300">
                  Allow guests to join (no login required)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="settings.requireApproval"
                  checked={formData.settings.requireApproval}
                  onChange={handleChange}
                  className="h-4 w-4 text-pink-600 bg-slate-700 border-slate-600 rounded focus:ring-pink-500 focus:ring-2"
                />
                <label className="ml-2 text-sm text-slate-300">
                  Require host approval for new members
                </label>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-700/50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Room
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoom;
