import { defineStore } from 'pinia';
import api from '../services/api';

export const useStockpileStore = defineStore('stockpiles', {
  state: () => ({
    stockpiles: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchStockpiles() {
      this.isLoading = true;
      try {
        const response = await api.get('/stockpiles/');
        this.stockpiles = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch stockpiles';
      } finally {
        this.isLoading = false;
      }
    },
    async addStockpile(stockpileData) {
      try {
        const response = await api.post('/stockpiles/', stockpileData);
        this.stockpiles.push(response.data);
        await this.fetchStockpiles(); // Refresh the list to include the new item and ensure consistency
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to add stockpile';
        throw err;
      }
    }
  }
});
