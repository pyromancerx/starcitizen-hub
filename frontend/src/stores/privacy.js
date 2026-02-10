// src/stores/privacy.js
import { defineStore } from 'pinia';
import api from '../services/api';

export const usePrivacyStore = defineStore('privacy', {
  state: () => ({
    settings: null,
    deletionStatus: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    isHiddenFromLeaderboards: (state) => state.settings?.hide_from_leaderboards || false,
    isTradeActivityHidden: (state) => state.settings?.hide_trade_activity || false,
    areAchievementsHidden: (state) => state.settings?.hide_achievements || false,
    isDataExportAllowed: (state) => state.settings?.allow_data_export !== false,
    hasDeletionRequest: (state) => state.deletionStatus?.deletion_requested || false,
    daysUntilDeletion: (state) => state.deletionStatus?.days_until_deletion || null,
  },

  actions: {
    async fetchSettings() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get('/privacy/settings');
        this.settings = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch privacy settings';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async updateSettings(settings) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.put('/privacy/settings', settings);
        this.settings = response.data;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to update privacy settings';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async exportData(format = 'json') {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.post('/privacy/export', { format }, {
          responseType: 'blob',
        });
        
        // Create download link
        const blob = new Blob([response.data], { 
          type: format === 'csv' ? 'application/zip' : 'application/json' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `user_data_export.${format === 'csv' ? 'zip' : 'json'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return true;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to export data';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async requestAccountDeletion(reason = '') {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.post('/privacy/delete-account', { reason });
        this.deletionStatus = response.data;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to request account deletion';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async cancelDeletionRequest() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.post('/privacy/cancel-deletion');
        this.deletionStatus = response.data;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to cancel deletion request';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchDeletionStatus() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get('/privacy/deletion-status');
        this.deletionStatus = response.data;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch deletion status';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
