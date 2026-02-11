import { defineStore } from 'pinia';
import api from '../services/api';

export const useMemberStore = defineStore('members', {
  state: () => ({
    members: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchMembers() {
      this.isLoading = true;
      try {
        const response = await api.get('/admin/users'); // Assuming we use admin endpoint or add a public one
        this.members = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch member manifest';
      } finally {
        this.isLoading = false;
      }
    },
    async inviteMember(inviteData) {
      this.isLoading = true; // Set loading state for the invitation process
      try {
        const response = await api.post('/crew/invite', inviteData); // Assuming backend endpoint for inviting
        await this.fetchMembers(); // Refresh the list to potentially show new pending invites or members
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to send invitation';
        throw err;
      } finally {
        this.isLoading = false;
      }
    }
  }
});
