import { defineStore } from 'pinia';
import api from '../services/api';

export const useFederationStore = defineStore('federation', {
  state: () => ({
    peers: [],
    federatedEvents: [],
    tradeRequests: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchPeers() {
      this.isLoading = true;
      try {
        const response = await api.get('/federation/peers');
        this.peers = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch peered instances';
      } finally {
        this.isLoading = false;
      }
    },
    async fetchFederatedEvents() {
      this.isLoading = true;
      try {
        const response = await api.get('/federation/events');
        this.federatedEvents = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch federated events';
      } finally {
        this.isLoading = false;
      }
    }
  }
});
