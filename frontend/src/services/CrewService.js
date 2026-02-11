import api from './api';

export default {
  // === LFG Post Endpoints ===
  async createLFGPost(postData) {
    try {
      const response = await api.post('/crew/lfg', postData);
      return response.data;
    } catch (error) {
      console.error('Error creating LFG post:', error);
      throw error;
    }
  },

  async getLFGPosts(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.activity_type) params.append('activity_type', filters.activity_type);
      if (filters.ship_type) params.append('ship_type', filters.ship_type);
      if (filters.skip) params.append('skip', filters.skip);
      if (filters.limit) params.append('limit', filters.limit);
      const response = await api.get(`/crew/lfg?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching LFG posts:', error);
      throw error;
    }
  },

  async getMyLFGPosts(skip = 0, limit = 50) {
    try {
      const response = await api.get('/crew/lfg/my', { params: { skip, limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching my LFG posts:', error);
      throw error;
    }
  },

  async getLFGPost(postId) {
    try {
      const response = await api.get(`/crew/lfg/${postId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching LFG post ${postId}:`, error);
      throw error;
    }
  },

  async updateLFGPost(postId, postData) {
    try {
      const response = await api.put(`/crew/lfg/${postId}`, postData);
      return response.data;
    } catch (error) {
      console.error(`Error updating LFG post ${postId}:`, error);
      throw error;
    }
  },

  async markLFGPostFilled(postId) {
    try {
      const response = await api.post(`/crew/lfg/${postId}/filled`);
      return response.data;
    } catch (error) {
      console.error(`Error marking LFG post ${postId} as filled:`, error);
      throw error;
    }
  },

  async cancelLFGPost(postId) {
    try {
      const response = await api.post(`/crew/lfg/${postId}/cancel`);
      return response.data;
    } catch (error) {
      console.error(`Error canceling LFG post ${postId}:`, error);
      throw error;
    }
  },

  async getLFGStats() {
    try {
      const response = await api.get('/crew/lfg/stats/overview');
      return response.data;
    } catch (error) {
      console.error('Error fetching LFG stats:', error);
      throw error;
    }
  },

  async respondToLFGPost(postId, responseData) {
    try {
      const response = await api.post(`/crew/lfg/${postId}/respond`, responseData);
      return response.data;
    } catch (error) {
      console.error(`Error responding to LFG post ${postId}:`, error);
      throw error;
    }
  },

  async getLFGPostResponses(postId) {
    try {
      const response = await api.get(`/crew/lfg/${postId}/responses`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching responses for LFG post ${postId}:`, error);
      throw error;
    }
  },

  // === Availability Endpoints ===
  async setAvailability(availabilityData) {
    try {
      const response = await api.post('/crew/availability', availabilityData);
      return response.data;
    } catch (error) {
      console.error('Error setting availability:', error);
      throw error;
    }
  },

  async getMyAvailability() {
    try {
      const response = await api.get('/crew/availability/my');
      return response.data;
    } catch (error) {
      console.error('Error fetching my availability:', error);
      throw error;
    }
  },

  async updateAvailability(availabilityId, availabilityData) {
    try {
      const response = await api.put(`/crew/availability/${availabilityId}`, availabilityData);
      return response.data;
    } catch (error) {
      console.error(`Error updating availability ${availabilityId}:`, error);
      throw error;
    }
  },

  async deleteAvailability(availabilityId) {
    try {
      await api.delete(`/crew/availability/${availabilityId}`);
    } catch (error) {
      console.error(`Error deleting availability ${availabilityId}:`, error);
      throw error;
    }
  },

  async getAvailabilityOverlaps() {
    try {
      const response = await api.get('/crew/availability/overlaps');
      return response.data;
    } catch (error) {
      console.error('Error fetching availability overlaps:', error);
      throw error;
    }
  },

  async getSessionSuggestions(minParticipants = 2, minDuration = 60) {
    try {
      const response = await api.get('/crew/availability/suggestions', { params: { min_participants: minParticipants, min_duration: minDuration } });
      return response.data;
    } catch (error) {
      console.error('Error fetching session suggestions:', error);
      throw error;
    }
  },

  // === Crew Loadout Endpoints ===
  async createLoadout(loadoutData) {
    try {
      const response = await api.post('/crew/loadouts', loadoutData);
      return response.data;
    } catch (error) {
      console.error('Error creating loadout:', error);
      throw error;
    }
  },

  async getMyLoadouts(skip = 0, limit = 50) {
    try {
      const response = await api.get('/crew/loadouts', { params: { skip, limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching my loadouts:', error);
      throw error;
    }
  },

  async getLoadoutTemplates(skip = 0, limit = 20) {
    try {
      const response = await api.get('/crew/loadouts/templates', { params: { skip, limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching loadout templates:', error);
      throw error;
    }
  },

  async getLoadout(loadoutId) {
    try {
      const response = await api.get(`/crew/loadouts/${loadoutId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching loadout ${loadoutId}:`, error);
      throw error;
    }
  },

  async updateLoadout(loadoutId, loadoutData) {
    try {
      const response = await api.put(`/crew/loadouts/${loadoutId}`, loadoutData);
      return response.data;
    } catch (error) {
      console.error(`Error updating loadout ${loadoutId}:`, error);
      throw error;
    }
  },

  async deleteLoadout(loadoutId) {
    try {
      await api.delete(`/crew/loadouts/${loadoutId}`);
    } catch (error) {
      console.error(`Error deleting loadout ${loadoutId}:`, error);
      throw error;
    }
  },

  async duplicateLoadout(loadoutId, newName) {
    try {
      const response = await api.post(`/crew/loadouts/${loadoutId}/duplicate`, null, { params: { new_name: newName } });
      return response.data;
    } catch (error) {
      console.error(`Error duplicating loadout ${loadoutId}:`, error);
      throw error;
    }
  },

  async quickDeployLoadout(loadoutId, substitutions = {}) {
    try {
      const response = await api.post(`/crew/loadouts/${loadoutId}/deploy`, { substitutions });
      return response.data;
    } catch (error) {
      console.error(`Error quick deploying loadout ${loadoutId}:`, error);
      throw error;
    }
  },
};
