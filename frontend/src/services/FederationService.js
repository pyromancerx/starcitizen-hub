import api from './api';

export default {
  // --- Peers ---
  async createPeer(peerData) {
    try {
      const response = await api.post('/federation/peers', peerData);
      return response.data;
    } catch (error) {
      console.error('Error creating peer:', error);
      throw error;
    }
  },

  async getPeers(skip = 0, limit = 20) {
    try {
      const response = await api.get(`/federation/peers?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching peers:', error);
      throw error;
    }
  },

  async getPeer(peerId) {
    try {
      const response = await api.get(`/federation/peers/${peerId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching peer ${peerId}:`, error);
      throw error;
    }
  },

  async updatePeer(peerId, peerData) {
    try {
      const response = await api.patch(`/federation/peers/${peerId}`, peerData);
      return response.data;
    } catch (error) {
      console.error(`Error updating peer ${peerId}:`, error);
      throw error;
    }
  },

  async deletePeer(peerId) {
    try {
      await api.delete(`/federation/peers/${peerId}`);
    } catch (error) {
      console.error(`Error deleting peer ${peerId}:`, error);
      throw error;
    }
  },

  // --- Federated Events ---
  async createFederatedEvent(peerId, eventData) {
    try {
      const response = await api.post(`/federation/peers/${peerId}/events`, eventData);
      return response.data;
    } catch (error) {
      console.error(`Error creating federated event for peer ${peerId}:`, error);
      throw error;
    }
  },

  async getFederatedEvents(skip = 0, limit = 20) {
    try {
      const response = await api.get(`/federation/events?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching federated events:', error);
      throw error;
    }
  },

  async getFederatedEvent(eventId) {
    try {
      const response = await api.get(`/federation/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching federated event ${eventId}:`, error);
      throw error;
    }
  },

  async updateFederatedEvent(eventId, eventData) {
    try {
      const response = await api.patch(`/federation/events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      console.error(`Error updating federated event ${eventId}:`, error);
      throw error;
    }
  },

  async deleteFederatedEvent(eventId) {
    try {
      await api.delete(`/federation/events/${eventId}`);
    } catch (error) {
      console.error(`Error deleting federated event ${eventId}:`, error);
      throw error;
    }
  },

  // --- Trade Requests ---
  async createTradeRequest(peerId, requestData) {
    try {
      const response = await api.post(`/federation/peers/${peerId}/trade-requests`, requestData);
      return response.data;
    } catch (error) {
      console.error(`Error creating trade request for peer ${peerId}:`, error);
      throw error;
    }
  },

  async getTradeRequests(skip = 0, limit = 20) {
    try {
      const response = await api.get(`/federation/trade-requests?skip=${skip}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trade requests:', error);
      throw error;
    }
  },

  async getTradeRequest(requestId) {
    try {
      const response = await api.get(`/federation/trade-requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching trade request ${requestId}:`, error);
      throw error;
    }
  },

  async updateTradeRequest(requestId, requestData) {
    try {
      const response = await api.patch(`/federation/trade-requests/${requestId}`, requestData);
      return response.data;
    } catch (error) {
      console.error(`Error updating trade request ${requestId}:`, error);
      throw error;
    }
  },

  async deleteTradeRequest(requestId) {
    try {
      await api.delete(`/federation/trade-requests/${requestId}`);
    } catch (error) {
      console.error(`Error deleting trade request ${requestId}:`, error);
      throw error;
    }
  },
};
