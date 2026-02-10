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
    async addInventoryItem(itemData) {
      try {
        const response = await api.post('/inventory/', itemData);
        // Assuming the API returns the newly created item
        this.items.push(response.data);
        // Optionally refetch to ensure consistent state with backend,
        // especially if backend applies any transformations or default values
        await this.fetchInventory();
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to add inventory item';
        throw err;
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
    },
    async transferFunds(transferData) {
      try {
        // Assuming transferData contains recipient_id, amount, description
        const response = await api.post('/wallet/transfer', transferData);
        // Refresh wallet data to reflect the new balance and transactions
        await this.fetchWallet();
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to transfer funds';
        throw err;
      }
    }
  }
});
