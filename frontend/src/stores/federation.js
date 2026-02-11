import { defineStore } from 'pinia';
import FederationService from '../services/FederationService';

export const useFederationStore = defineStore('federation', {
  state: () => ({
    peers: [],
    selectedPeer: null,
    federatedEvents: [],
    tradeRequests: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    // --- Peers ---
    async fetchPeers() {
      this.isLoading = true;
      try {
        this.peers = await FederationService.getPeers();
      } catch (error) {
        this.error = error;
        console.error('Failed to fetch peers:', error);
      } finally {
        this.isLoading = false;
      }
    },
    async fetchPeer(peerId) {
      this.isLoading = true;
      try {
        this.selectedPeer = await FederationService.getPeer(peerId);
      } catch (error) {
        this.error = error;
        console.error(`Failed to fetch peer ${peerId}:`, error);
      } finally {
        this.isLoading = false;
      }
    },
    async createPeer(peerData) {
      this.isLoading = true;
      try {
        const newPeer = await FederationService.createPeer(peerData);
        this.peers.push(newPeer);
        return newPeer;
      } catch (error) {
        this.error = error;
        console.error('Failed to create peer:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async updatePeer(peerId, peerData) {
      this.isLoading = true;
      try {
        const updatedPeer = await FederationService.updatePeer(peerId, peerData);
        const index = this.peers.findIndex(p => p.id === peerId);
        if (index !== -1) {
          this.peers[index] = updatedPeer;
        }
        if (this.selectedPeer?.id === peerId) {
          this.selectedPeer = updatedPeer;
        }
        return updatedPeer;
      } catch (error) {
        this.error = error;
        console.error(`Failed to update peer ${peerId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async deletePeer(peerId) {
      this.isLoading = true;
      try {
        await FederationService.deletePeer(peerId);
        this.peers = this.peers.filter(p => p.id !== peerId);
        if (this.selectedPeer?.id === peerId) {
          this.selectedPeer = null;
        }
      } catch (error) {
        this.error = error;
        console.error(`Failed to delete peer ${peerId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // --- Federated Events ---
    async fetchFederatedEvents(skip = 0, limit = 20) {
      this.isLoading = true;
      try {
        this.federatedEvents = await FederationService.getFederatedEvents(skip, limit);
      } catch (error) {
        this.error = error;
        console.error('Failed to fetch federated events:', error);
      } finally {
        this.isLoading = false;
      }
    },
    async fetchFederatedEvent(eventId) {
      this.isLoading = true;
      try {
        const event = await FederationService.getFederatedEvent(eventId);
        return event;
      } catch (error) {
        this.error = error;
        console.error(`Failed to fetch federated event ${eventId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async createFederatedEvent(peerId, eventData) {
      this.isLoading = true;
      try {
        const newEvent = await FederationService.createFederatedEvent(peerId, eventData);
        this.federatedEvents.push(newEvent); // Or update relevant list
        return newEvent;
      } catch (error) {
        this.error = error;
        console.error('Failed to create federated event:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async updateFederatedEvent(eventId, eventData) {
      this.isLoading = true;
      try {
        const updatedEvent = await FederationService.updateFederatedEvent(eventId, eventData);
        const index = this.federatedEvents.findIndex(e => e.id === eventId);
        if (index !== -1) {
          this.federatedEvents[index] = updatedEvent;
        }
        return updatedEvent;
      } catch (error) {
        this.error = error;
        console.error(`Failed to update federated event ${eventId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async deleteFederatedEvent(eventId) {
      this.isLoading = true;
      try {
        await FederationService.deleteFederatedEvent(eventId);
        this.federatedEvents = this.federatedEvents.filter(e => e.id !== eventId);
      } catch (error) {
        this.error = error;
        console.error(`Failed to delete federated event ${eventId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    // --- Trade Requests ---
    async fetchTradeRequests(skip = 0, limit = 20) {
      this.isLoading = true;
      try {
        this.tradeRequests = await FederationService.getTradeRequests(skip, limit);
      } catch (error) {
        this.error = error;
        console.error('Failed to fetch trade requests:', error);
      } finally {
        this.isLoading = false;
      }
    },
    async fetchTradeRequest(requestId) {
      this.isLoading = true;
      try {
        const request = await FederationService.getTradeRequest(requestId);
        return request;
      } catch (error) {
        this.error = error;
        console.error(`Failed to fetch trade request ${requestId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async createTradeRequest(peerId, requestData) {
      this.isLoading = true;
      try {
        const newRequest = await FederationService.createTradeRequest(peerId, requestData);
        this.tradeRequests.push(newRequest); // Or update relevant list
        return newRequest;
      } catch (error) {
        this.error = error;
        console.error('Failed to create trade request:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async updateTradeRequest(requestId, requestData) {
      this.isLoading = true;
      try {
        const updatedRequest = await FederationService.updateTradeRequest(requestId, requestData);
        const index = this.tradeRequests.findIndex(r => r.id === requestId);
        if (index !== -1) {
          this.tradeRequests[index] = updatedRequest;
        }
        return updatedRequest;
      } catch (error) {
        this.error = error;
        console.error(`Failed to update trade request ${requestId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async deleteTradeRequest(requestId) {
      this.isLoading = true;
      try {
        await FederationService.deleteTradeRequest(requestId);
        this.tradeRequests = this.tradeRequests.filter(r => r.id !== requestId);
      } catch (error) {
        this.error = error;
        console.error(`Failed to delete trade request ${requestId}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});