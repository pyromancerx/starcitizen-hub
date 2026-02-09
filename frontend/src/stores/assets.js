import { defineStore } from 'pinia';
import api from '../services/api';

export const useShipStore = defineStore('ships', {
  state: () => ({
    ships: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchShips() {
      this.isLoading = true;
      try {
        const response = await api.get('/ships/');
        this.ships = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch ships';
      } finally {
        this.isLoading = false;
      }
    },
    async addShip(shipData) {
      try {
        const response = await api.post('/ships/', shipData);
        this.ships.push(response.data);
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to add ship';
        throw err;
      }
    }
  }
});

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    items: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchInventory() {
      this.isLoading = true;
      try {
        const response = await api.get('/inventory/');
        this.items = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch inventory';
      } finally {
        this.isLoading = false;
      }
    }
  }
});

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    wallet: null,
    transactions: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchWallet() {
      this.isLoading = true;
      try {
        const response = await api.get('/wallets/me');
        this.wallet = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch wallet';
      } finally {
        this.isLoading = false;
      }
    }
  }
});
