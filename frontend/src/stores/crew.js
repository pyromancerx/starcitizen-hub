import { defineStore } from 'pinia';
import CrewService from '../services/CrewService'; // Import CrewService

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
        const response = await CrewService.getLFGPosts(filters); // Use CrewService
        this.lfgPosts = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch LFG posts';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMyLfgPosts() {
      this.isLoading = true;
      try {
        const response = await CrewService.getMyLFGPosts(); // Use CrewService
        this.myLfgPosts = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch my LFG posts';
      } finally {
        this.isLoading = false;
      }
    },

    async getLfgPost(postId) {
      this.isLoading = true;
      try {
        const response = await CrewService.getLFGPost(postId);
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch LFG post';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async createLfgPost(postData) {
      try {
        const response = await CrewService.createLFGPost(postData); // Use CrewService
        this.lfgPosts.unshift(response);
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to create LFG post';
        throw err;
      }
    },

    async updateLfgPost(postId, postData) {
      try {
        const response = await CrewService.updateLFGPost(postId, postData);
        const idx = this.lfgPosts.findIndex(p => p.id === postId);
        if (idx !== -1) this.lfgPosts[idx] = response;
        const myIdx = this.myLfgPosts.findIndex(p => p.id === postId);
        if (myIdx !== -1) this.myLfgPosts[myIdx] = response;
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to update LFG post';
        throw err;
      }
    },

    async respondToLfg(postId, responseData) {
      try {
        const response = await CrewService.respondToLFGPost(postId, responseData); // Use CrewService
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to respond to LFG post';
        throw err;
      }
    },

    async markPostFilled(postId) {
      try {
        const response = await CrewService.markLFGPostFilled(postId); // Use CrewService
        const idx = this.lfgPosts.findIndex(p => p.id === postId);
        if (idx !== -1) this.lfgPosts[idx] = response;
        const myIdx = this.myLfgPosts.findIndex(p => p.id === postId);
        if (myIdx !== -1) this.myLfgPosts[myIdx] = response;
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to mark post as filled';
        throw err;
      }
    },

    async cancelLfgPost(postId) {
      try {
        const response = await CrewService.cancelLFGPost(postId); // Use CrewService
        const idx = this.lfgPosts.findIndex(p => p.id === postId);
        if (idx !== -1) this.lfgPosts.splice(idx, 1);
        const myIdx = this.myLfgPosts.findIndex(p => p.id === postId);
        if (myIdx !== -1) this.myLfgPosts[myIdx] = response;
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to cancel LFG post';
        throw err;
      }
    },

    async fetchLfgStats() {
      try {
        const response = await CrewService.getLFGStats(); // Use CrewService
        this.lfgStats = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch LFG stats';
      }
    },

    async getLfgPostResponses(postId) {
      try {
        const response = await CrewService.getLFGPostResponses(postId);
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch LFG post responses';
        throw err;
      }
    },

    // Availability
    async fetchMyAvailability() {
      this.isLoading = true;
      try {
        const response = await CrewService.getMyAvailability(); // Use CrewService
        this.availability = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch availability';
      } finally {
        this.isLoading = false;
      }
    },

    async setAvailability(availabilityData) {
      try {
        const response = await CrewService.setAvailability(availabilityData); // Use CrewService
        const idx = this.availability.findIndex(a => a.day_of_week === response.day_of_week);
        if (idx !== -1) {
          this.availability[idx] = response;
        } else {
          this.availability.push(response);
          this.availability.sort((a, b) => a.day_of_week - b.day_of_week);
        }
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to set availability';
        throw err;
      }
    },

    async updateAvailability(availabilityId, availabilityData) {
      try {
        const response = await CrewService.updateAvailability(availabilityId, availabilityData);
        const idx = this.availability.findIndex(a => a.id === availabilityId);
        if (idx !== -1) {
          this.availability[idx] = response;
        }
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to update availability';
        throw err;
      }
    },

    async deleteAvailability(availabilityId) {
      try {
        await CrewService.deleteAvailability(availabilityId); // Use CrewService
        this.availability = this.availability.filter(a => a.id !== availabilityId);
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to delete availability';
        throw err;
      }
    },

    async fetchAvailabilityOverlaps() {
      try {
        const response = await CrewService.getAvailabilityOverlaps(); // Use CrewService
        this.availabilityOverlaps = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch availability overlaps';
      }
    },

    async fetchSessionSuggestions(params = {}) {
      try {
        const response = await CrewService.getSessionSuggestions(params.min_participants, params.min_duration); // Use CrewService
        this.sessionSuggestions = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch session suggestions';
      }
    },

    // Crew Loadouts
    async fetchLoadouts() {
      this.isLoading = true;
      try {
        const response = await CrewService.getMyLoadouts(); // Use CrewService
        this.loadouts = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch loadouts';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchLoadoutTemplates() {
      try {
        const response = await CrewService.getLoadoutTemplates(); // Use CrewService
        this.loadoutTemplates = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch loadout templates';
      }
    },

    async createLoadout(loadoutData) {
      try {
        const response = await CrewService.createLoadout(loadoutData); // Use CrewService
        this.loadouts.unshift(response);
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to create loadout';
        throw err;
      }
    },

    async updateLoadout(loadoutId, updateData) {
      try {
        const response = await CrewService.updateLoadout(loadoutId, updateData); // Use CrewService
        const idx = this.loadouts.findIndex(l => l.id === loadoutId);
        if (idx !== -1) this.loadouts[idx] = response;
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to update loadout';
        throw err;
      }
    },

    async deleteLoadout(loadoutId) {
      try {
        await CrewService.deleteLoadout(loadoutId); // Use CrewService
        this.loadouts = this.loadouts.filter(l => l.id !== loadoutId);
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to delete loadout';
        throw err;
      }
    },

    async duplicateLoadout(loadoutId, newName) {
      try {
        const response = await CrewService.duplicateLoadout(loadoutId, newName); // Use CrewService
        this.loadouts.unshift(response);
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to duplicate loadout';
        throw err;
      }
    },

    async deployLoadout(loadoutId, substitutions = {}) {
      try {
        const response = await CrewService.quickDeployLoadout(loadoutId, substitutions); // Use CrewService
        this.loadouts.unshift(response);
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to deploy loadout';
        throw err;
      }
    },
  }
});
