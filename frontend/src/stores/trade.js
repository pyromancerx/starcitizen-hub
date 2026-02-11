import { defineStore } from 'pinia';
import api from '../services/api';

export const useTradeStore = defineStore('trade', {
  state: () => ({
    tradeRuns: [],
    priceReports: [],
    contracts: [],
    myContracts: [],
    myHaulingContracts: [],
    tradeStats: null,
    haulerStats: null,
    leaderboard: [],
    bestRoutes: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    // Trade Runs
    async fetchTradeRuns() {
      this.isLoading = true;
      try {
        const response = await api.get('/trade/runs');
        this.tradeRuns = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch trade runs';
      } finally {
        this.isLoading = false;
      }
    },

    async createTradeRun(runData) {
      try {
        const response = await api.post('/trade/runs', runData);
        this.tradeRuns.unshift(response.data);
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to create trade run';
        throw err;
      }
    },

    async deleteTradeRun(runId) {
      try {
        await api.delete(`/trade/runs/${runId}`);
        this.tradeRuns = this.tradeRuns.filter(r => r.id !== runId);
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to delete trade run';
        throw err;
      }
    },

    async fetchTradeStats() {
      try {
        const response = await api.get('/trade/stats/my');
        this.tradeStats = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch trade stats';
      }
    },

    async fetchLeaderboard() {
      try {
        const response = await api.get('/trade/leaderboard');
        this.leaderboard = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch leaderboard';
      }
    },

    // Price Reports
    async fetchPriceReports(filters = {}) {
      this.isLoading = true;
      try {
        const params = new URLSearchParams();
        if (filters.location) params.append('location', filters.location);
        if (filters.commodity) params.append('commodity', filters.commodity);
        
        const response = await api.get(`/trade/prices?${params}`);
        this.priceReports = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch price reports';
      } finally {
        this.isLoading = false;
      }
    },

    async createPriceReport(reportData) {
      try {
        const response = await api.post('/trade/prices', reportData);
        this.priceReports.unshift(response.data);
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to create price report';
        throw err;
      }
    },

    async fetchBestRoutes() {
      try {
        const response = await api.get('/trade/routes/best');
        this.bestRoutes = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch best routes';
      }
    },

    // Cargo Contracts
    async fetchOpenContracts() {
      this.isLoading = true;
      try {
        const response = await api.get('/trade/contracts/open');
        this.contracts = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch contracts';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMyContracts() {
      try {
        const response = await api.get('/trade/contracts/my');
        this.myContracts = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch my contracts';
      }
    },

    async fetchMyHaulingContracts() {
      try {
        const response = await api.get('/trade/contracts/hauling');
        this.myHaulingContracts = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch hauling contracts';
      }
    },

    async createContract(contractData) {
      try {
        const response = await api.post('/trade/contracts', contractData);
        this.myContracts.unshift(response.data);
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to create contract';
        throw err;
      }
    },

    async acceptContract(contractId) {
      try {
        const response = await api.post(`/trade/contracts/${contractId}/accept`);
        // Update contract in lists
        const idx = this.contracts.findIndex(c => c.id === contractId);
        if (idx !== -1) {
          this.contracts[idx] = response.data;
        }
        this.myHaulingContracts.unshift(response.data);
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to accept contract';
        throw err;
      }
    },

    async completeContract(contractId) {
      try {
        const response = await api.post(`/trade/contracts/${contractId}/complete`);
        // Update in all lists
        [this.contracts, this.myContracts, this.myHaulingContracts].forEach(list => {
          const idx = list.findIndex(c => c.id === contractId);
          if (idx !== -1) list[idx] = response.data;
        });
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to complete contract';
        throw err;
      }
    },

    // NEW: startContract action
    async startContract(contractId) {
      try {
        const response = await api.post(`/trade/contracts/${contractId}/start`);
        // Update in all lists
        [this.contracts, this.myContracts, this.myHaulingContracts].forEach(list => {
          const idx = list.findIndex(c => c.id === contractId);
          if (idx !== -1) list[idx] = response.data;
        });
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to start contract';
        throw err;
      }
    },

    async cancelContract(contractId) {
      try {
        const response = await api.post(`/trade/contracts/${contractId}/cancel`);
        // Update in all lists
        [this.contracts, this.myContracts, this.myHaulingContracts].forEach(list => {
          const idx = list.findIndex(c => c.id === contractId);
          if (idx !== -1) list[idx] = response.data;
        });
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to cancel contract';
        throw err;
      }
    },

    async fetchHaulerStats() {
      try {
        const response = await api.get('/trade/hauler/stats');
        this.haulerStats = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch hauler stats';
      }
    },
  }
});
