import { defineStore } from 'pinia';
import api from '../services/api';

export const useAchievementStore = defineStore('achievement', {
  state: () => ({
    achievements: [],
    myAchievements: [],
    mySummary: null,
    leaderboard: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    // Get all available achievements
    async fetchAchievements(params = {}) {
      this.isLoading = true;
      try {
        const queryParams = new URLSearchParams();
        if (params.active_only !== false) queryParams.append('active_only', 'true');
        if (params.achievement_type) queryParams.append('achievement_type', params.achievement_type);
        if (params.skip) queryParams.append('skip', params.skip);
        if (params.limit) queryParams.append('limit', params.limit);
        
        const response = await api.get(`/achievements/?${queryParams}`);
        this.achievements = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch achievements';
      } finally {
        this.isLoading = false;
      }
    },

    // Get my earned achievements
    async fetchMyAchievements(params = {}) {
      this.isLoading = true;
      try {
        const queryParams = new URLSearchParams();
        if (params.skip) queryParams.append('skip', params.skip);
        if (params.limit) queryParams.append('limit', params.limit);
        
        const response = await api.get(`/achievements/my/achievements?${queryParams}`);
        this.myAchievements = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch my achievements';
      } finally {
        this.isLoading = false;
      }
    },

    // Get my achievement summary
    async fetchMySummary() {
      try {
        const response = await api.get('/achievements/my/summary');
        this.mySummary = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch achievement summary';
      }
    },

    // Check for new achievements (auto-award)
    async checkAchievements() {
      try {
        const response = await api.post('/achievements/check');
        if (response.data.length > 0) {
          // Refresh my achievements and summary
          await this.fetchMyAchievements();
          await this.fetchMySummary();
        }
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to check achievements';
        return [];
      }
    },

    // Get achievement leaderboard
    async fetchLeaderboard(limit = 10) {
      try {
        const response = await api.get(`/achievements/leaderboard/top?limit=${limit}`);
        this.leaderboard = response.data.entries;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch leaderboard';
      }
    },

    // Admin: Create achievement
    async createAchievement(achievementData) {
      try {
        const response = await api.post('/achievements/', achievementData);
        this.achievements.push(response.data);
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to create achievement';
        throw err;
      }
    },

    // Admin: Award achievement to user
    async awardAchievement(userId, achievementId, awardNote = null) {
      try {
        const response = await api.post('/achievements/award', {
          user_id: userId,
          achievement_id: achievementId,
          award_note: awardNote,
        });
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to award achievement';
        throw err;
      }
    },

    // Admin: Setup default achievements
    async setupDefaultAchievements() {
      try {
        await api.post('/achievements/setup/defaults');
        await this.fetchAchievements();
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to setup default achievements';
        throw err;
      }
    },
  }
});
