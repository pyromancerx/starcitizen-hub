// src/stores/rsi.js
import { defineStore } from 'pinia';
import api from '../services/api';

export const useRSIStore = defineStore('rsi', {
  state: () => ({
    verificationStatus: null,
    pendingRequests: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    isVerified: (state) => state.verificationStatus?.is_verified || false,
    rsiHandle: (state) => state.verificationStatus?.rsi_handle || null,
    hasPendingRequest: (state) => !!state.verificationStatus?.pending_request,
  },

  actions: {
    async fetchVerificationStatus() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get('/rsi/status');
        this.verificationStatus = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to load verification status';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async submitVerification(rsiHandle, screenshotUrl) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.post('/rsi/verify', {
          rsi_handle: rsiHandle,
          screenshot_url: screenshotUrl,
        });
        await this.fetchVerificationStatus();
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to submit verification';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchUserRSIProfile(userId) {
      try {
        const response = await api.get(`/rsi/profile/${userId}`);
        return response.data;
      } catch (err) {
        throw err;
      }
    },

    // Admin actions
    async fetchPendingRequests() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get('/rsi/admin/pending');
        this.pendingRequests = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to load pending requests';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async reviewRequest(requestId, approved, adminNotes = '') {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.post(`/rsi/admin/review/${requestId}`, {
          approved,
          admin_notes: adminNotes,
        });
        // Remove from pending list
        this.pendingRequests = this.pendingRequests.filter(
          req => req.id !== requestId
        );
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to review request';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
