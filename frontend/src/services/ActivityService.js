import api from './api';

export default {
  async getActivityFeed(params = {}) {
    try {
      const response = await api.get('/activity/feed', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      throw error;
    }
  },

  async getRecentActivities(hours = 24) {
    try {
      const response = await api.get('/activity/recent', { params: { hours } });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  },

  async getActivityTypes() {
    try {
      const response = await api.get('/activity/types');
      return response.data;
    } catch (error) {
      console.error('Error fetching activity types:', error);
      throw error;
    }
  },

  async getActivityStats(days = 7) {
    try {
      const response = await api.get('/activity/stats', { params: { days } });
      return response.data;
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      throw error;
    }
  },

  async addReaction(activityId, emoji) {
    try {
      const response = await api.post(`/activity/${activityId}/react`, { emoji });
      return response.data;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  },

  async removeReaction(activityId, emoji) {
    try {
      const response = await api.delete(`/activity/${activityId}/react`, { data: { emoji } });
      return response.data;
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  },
};
