import { defineStore } from 'pinia';
import ActivityService from '../services/ActivityService'; // Import ActivityService

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
        const response = await ActivityService.getActivityFeed(params); // Use ActivityService
        
        if (params.offset && params.offset > 0) {
          this.activities = [...this.activities, ...response.activities];
        } else {
          this.activities = response.activities;
        }
        
        this.totalCount = response.total_count;
        this.hasMore = response.has_more;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch activity feed';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchRecentActivities(hours = 24) {
      try {
        const response = await ActivityService.getRecentActivities(hours); // Use ActivityService
        this.activities = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch recent activities';
      }
    },

    async fetchActivityTypes() {
      try {
        const response = await ActivityService.getActivityTypes(); // Use ActivityService
        this.activityTypes = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch activity types';
      }
    },

    async fetchStats(days = 7) {
      try {
        const response = await ActivityService.getActivityStats(days); // Use ActivityService
        this.stats = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch activity stats';
      }
    },

    async addReaction(activityId, emoji) {
      try {
        const response = await ActivityService.addReaction(activityId, emoji); // Use ActivityService
        // Update the activity in the list
        const activity = this.activities.find(a => a.id === activityId);
        if (activity) {
          if (!activity.reactions) activity.reactions = [];
          activity.reactions.push(response); // response is already data
          activity.reaction_count = (activity.reaction_count || 0) + 1;
        }
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to add reaction';
        throw err;
      }
    },

    async removeReaction(activityId, emoji) {
      try {
        await ActivityService.removeReaction(activityId, emoji); // Use ActivityService
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
