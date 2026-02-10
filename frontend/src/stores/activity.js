import { defineStore } from 'pinia';
import api from '../services/api';

export const useActivityStore = defineStore('activity', {
  state: () => ({
    activities: [],
    totalCount: 0,
    hasMore: false,
    isLoading: false,
    error: null,
    activityTypes: [],
    stats: null,
    pollingInterval: null,
  }),
  actions: {
    async fetchActivityFeed(params = {}) {
      this.isLoading = true;
      try {
        const queryParams = new URLSearchParams();
        if (params.type) queryParams.append('activity_type', params.type);
        if (params.userId) queryParams.append('user_id', params.userId);
        if (params.hours) queryParams.append('hours', params.hours);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.offset) queryParams.append('offset', params.offset);
        
        const response = await api.get(`/activity/feed?${queryParams}`);
        
        if (params.offset && params.offset > 0) {
          // Append for pagination
          this.activities = [...this.activities, ...response.data.activities];
        } else {
          // Replace for initial load
          this.activities = response.data.activities;
        }
        
        this.totalCount = response.data.total_count;
        this.hasMore = response.data.has_more;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch activity feed';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchRecentActivities(hours = 24) {
      try {
        const response = await api.get(`/activity/recent?hours=${hours}`);
        this.activities = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch recent activities';
      }
    },

    async fetchActivityTypes() {
      try {
        const response = await api.get('/activity/types');
        this.activityTypes = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch activity types';
      }
    },

    async fetchStats(days = 7) {
      try {
        const response = await api.get(`/activity/stats?days=${days}`);
        this.stats = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch activity stats';
      }
    },

    async addReaction(activityId, emoji) {
      try {
        const response = await api.post(`/activity/${activityId}/react`, { emoji });
        // Update the activity in the list
        const activity = this.activities.find(a => a.id === activityId);
        if (activity) {
          if (!activity.reactions) activity.reactions = [];
          activity.reactions.push(response.data);
          activity.reaction_count = (activity.reaction_count || 0) + 1;
        }
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to add reaction';
        throw err;
      }
    },

    async removeReaction(activityId, emoji) {
      try {
        await api.delete(`/activity/${activityId}/react/${encodeURIComponent(emoji)}`);
        // Update the activity in the list
        const activity = this.activities.find(a => a.id === activityId);
        if (activity && activity.reactions) {
          activity.reactions = activity.reactions.filter(r => r.emoji !== emoji);
          activity.reaction_count = Math.max(0, (activity.reaction_count || 0) - 1);
        }
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to remove reaction';
        throw err;
      }
    },

    startPolling(intervalMs = 30000) {
      // Poll every 30 seconds for new activities
      this.stopPolling();
      this.pollingInterval = setInterval(() => {
        this.fetchRecentActivities(1); // Only fetch last hour for updates
      }, intervalMs);
    },

    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    },

    clearActivities() {
      this.activities = [];
      this.totalCount = 0;
      this.hasMore = false;
    },
  }
});
