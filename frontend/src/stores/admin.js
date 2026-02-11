import { defineStore } from 'pinia';
import api from '../services/api'; // Assuming 'api' is configured for Axios or similar

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchAllUsers() {
      this.isLoading = true;
      try {
        const response = await api.get('/admin/members_json');
        this.users = response.data;
      } catch (error) {
        this.error = error;
        console.error('Failed to fetch all users:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async adminChangeUserPassword(userId, newPassword) {
      this.isLoading = true;
      try {
        const response = await api.post(`/admin/users/${userId}/change-password`, { new_password: newPassword });
        // Optionally update the user in the local state if needed
        const index = this.users.findIndex(user => user.id === userId);
        if (index !== -1) {
          this.users[index] = { ...this.users[index], ...response.data };
        }
        return response.data;
      } catch (error) {
        this.error = error;
        console.error(`Failed to change password for user ${userId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async adminApproveUser(userId) {
      this.isLoading = true;
      try {
        const response = await api.post(`/admin/users/${userId}/approve-json`);
        // Update the user in the local state
        const index = this.users.findIndex(user => user.id === userId);
        if (index !== -1) {
          this.users[index] = { ...this.users[index], ...response.data };
        }
        return response.data;
      } catch (error) {
        this.error = error;
        console.error(`Failed to approve user ${userId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async adminSetUserStatus(userId, isActive) {
      this.isLoading = true;
      try {
        const response = await api.patch(`/admin/users/${userId}/status?is_active=${isActive}`);
        // Update the user in the local state
        const index = this.users.findIndex(user => user.id === userId);
        if (index !== -1) {
          this.users[index] = { ...this.users[index], ...response.data };
        }
        return response.data;
      } catch (error) {
        this.error = error;
        console.error(`Failed to set status for user ${userId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async adminDeleteUser(userId) {
      this.isLoading = true;
      try {
        await api.delete(`/admin/users/${userId}`);
        this.users = this.users.filter(user => user.id !== userId);
      } catch (error) {
        this.error = error;
        console.error(`Failed to delete user ${userId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});