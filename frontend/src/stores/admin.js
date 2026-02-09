import { defineStore } from 'pinia';
import api from '../services/api';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    roles: [],
    settings: {},
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchRoles() {
      this.isLoading = true;
      try {
        const response = await api.get('/admin/roles'); // Assuming these endpoints exist
        this.roles = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch roles';
      } finally {
        this.isLoading = false;
      }
    },
    async approveUser(userId) {
      try {
        await api.post(`/admin/users/${userId}/approve`);
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to approve user';
        throw err;
      }
    }
  }
});
