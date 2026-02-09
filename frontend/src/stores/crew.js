import { defineStore } from 'pinia';
import api from '../services/api';

export const useCrewStore = defineStore('crew', {
  state: () => ({
    lfgPosts: [],
    myLfgPosts: [],
    lfgStats: null,
    availability: [],
    availabilityOverlaps: [],
    sessionSuggestions: [],
    loadouts: [],
    loadoutTemplates: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    // LFG Posts
    async fetchLfgPosts(filters = {}) {
      this.isLoading = true;
      try {
        const params = new URLSearchParams();
        if (filters.activity_type) params.append('activity_type', filters.activity_type);
        if (filters.ship_type) params.append('ship_type', filters.ship_type);
        
        const response = await api.get(`/crew/lfg?${params}`);
        this.lfgPosts = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch LFG posts';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMyLfgPosts() {
      this.isLoading = true;
      try {
        const response = await api.get('/crew/lfg/my');
        this.myLfgPosts = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch my LFG posts';
      } finally {
        this.isLoading = false;
      }
    },

    async createLfgPost(postData) {
      try {
        const response = await api.post('/crew/lfg', postData);
        this.lfgPosts.unshift(response.data);
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to create LFG post';
        throw err;
      }
    },

    async respondToLfg(postId, responseData) {
      try {
        const response = await api.post(`/crew/lfg/${postId}/respond`, responseData);
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to respond to LFG post';
        throw err;
      }
    },

    async markPostFilled(postId) {
      try {
        const response = await api.post(`/crew/lfg/${postId}/filled`);
        // Update in lists
        const idx = this.lfgPosts.findIndex(p => p.id === postId);
        if (idx !== -1) this.lfgPosts[idx] = response.data;
        const myIdx = this.myLfgPosts.findIndex(p => p.id === postId);
        if (myIdx !== -1) this.myLfgPosts[myIdx] = response.data;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to mark post as filled';
        throw err;
      }
    },

    async cancelLfgPost(postId) {
      try {
        const response = await api.post(`/crew/lfg/${postId}/cancel`);
        // Update in lists
        const idx = this.lfgPosts.findIndex(p => p.id === postId);
        if (idx !== -1) this.lfgPosts.splice(idx, 1);
        const myIdx = this.myLfgPosts.findIndex(p => p.id === postId);
        if (myIdx !== -1) this.myLfgPosts[myIdx] = response.data;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to cancel LFG post';
        throw err;
      }
    },

    async fetchLfgStats() {
      try {
        const response = await api.get('/crew/lfg/stats/overview');
        this.lfgStats = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch LFG stats';
      }
    },

    // Availability
    async fetchMyAvailability() {
      this.isLoading = true;
      try {
        const response = await api.get('/crew/availability/my');
        this.availability = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch availability';
      } finally {
        this.isLoading = false;
      }
    },

    async setAvailability(availabilityData) {
      try {
        const response = await api.post('/crew/availability', availabilityData);
        // Replace or add to availability list
        const idx = this.availability.findIndex(a => a.day_of_week === response.data.day_of_week);
        if (idx !== -1) {
          this.availability[idx] = response.data;
        } else {
          this.availability.push(response.data);
          this.availability.sort((a, b) => a.day_of_week - b.day_of_week);
        }
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to set availability';
        throw err;
      }
    },

    async deleteAvailability(availabilityId) {
      try {
        await api.delete(`/crew/availability/${availabilityId}`);
        this.availability = this.availability.filter(a => a.id !== availabilityId);
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to delete availability';
        throw err;
      }
    },

    async fetchAvailabilityOverlaps() {
      try {
        const response = await api.get('/crew/availability/overlaps');
        this.availabilityOverlaps = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch availability overlaps';
      }
    },

    async fetchSessionSuggestions(params = {}) {
      try {
        const queryParams = new URLSearchParams();
        if (params.min_participants) queryParams.append('min_participants', params.min_participants);
        if (params.min_duration) queryParams.append('min_duration', params.min_duration);
        
        const response = await api.get(`/crew/availability/suggestions?${queryParams}`);
        this.sessionSuggestions = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch session suggestions';
      }
    },

    // Crew Loadouts
    async fetchLoadouts() {
      this.isLoading = true;
      try {
        const response = await api.get('/crew/loadouts');
        this.loadouts = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch loadouts';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchLoadoutTemplates() {
      try {
        const response = await api.get('/crew/loadouts/templates');
        this.loadoutTemplates = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch loadout templates';
      }
    },

    async createLoadout(loadoutData) {
      try {
        const response = await api.post('/crew/loadouts', loadoutData);
        this.loadouts.unshift(response.data);
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to create loadout';
        throw err;
      }
    },

    async updateLoadout(loadoutId, updateData) {
      try {
        const response = await api.put(`/crew/loadouts/${loadoutId}`, updateData);
        const idx = this.loadouts.findIndex(l => l.id === loadoutId);
        if (idx !== -1) this.loadouts[idx] = response.data;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to update loadout';
        throw err;
      }
    },

    async deleteLoadout(loadoutId) {
      try {
        await api.delete(`/crew/loadouts/${loadoutId}`);
        this.loadouts = this.loadouts.filter(l => l.id !== loadoutId);
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to delete loadout';
        throw err;
      }
    },

    async duplicateLoadout(loadoutId, newName) {
      try {
        const response = await api.post(`/crew/loadouts/${loadoutId}/duplicate?new_name=${encodeURIComponent(newName)}`);
        this.loadouts.unshift(response.data);
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to duplicate loadout';
        throw err;
      }
    },

    async deployLoadout(loadoutId, substitutions = {}) {
      try {
        const response = await api.post(`/crew/loadouts/${loadoutId}/deploy`, { substitutions });
        this.loadouts.unshift(response.data);
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to deploy loadout';
        throw err;
      }
    },
  }
});
