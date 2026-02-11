import { defineStore } from 'pinia';
import TradeService from '../services/TradeService'; // Import TradeService

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
        const response = await TradeService.getMyTradeRuns();
        this.tradeRuns = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch trade runs';
      } finally {
        this.isLoading = false;
      }
    },

    async getTradeRun(runId) {
      this.isLoading = true;
      try {
        const response = await TradeService.getTradeRun(runId);
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch trade run';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async createTradeRun(runData) {
      try {
        const response = await TradeService.createTradeRun(runData);
        this.tradeRuns.unshift(response);
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to create trade run';
        throw err;
      }
    },

    async updateTradeRun(runId, runData) {
      try {
        const response = await TradeService.updateTradeRun(runId, runData);
        const index = this.tradeRuns.findIndex(run => run.id === runId);
        if (index !== -1) {
          this.tradeRuns[index] = response;
        }
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to update trade run';
        throw err;
      }
    },

    async deleteTradeRun(runId) {
      try {
        await TradeService.deleteTradeRun(runId);
        this.tradeRuns = this.tradeRuns.filter(r => r.id !== runId);
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to delete trade run';
        throw err;
      }
    },

    async fetchTradeStats() {
      try {
        const response = await TradeService.getTradeStats();
        this.tradeStats = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch trade stats';
      }
    },

    async fetchLeaderboard() {
      try {
        const response = await TradeService.getTradeLeaderboard();
        this.leaderboard = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch leaderboard';
      }
    },

    // Price Reports
    async fetchPriceReports(filters = {}) {
      this.isLoading = true;
      try {
        const response = await TradeService.getPriceReports(filters);
        this.priceReports = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch price reports';
      } finally {
        this.isLoading = false;
      }
    },

    async createPriceReport(reportData) {
      try {
        const response = await TradeService.createPriceReport(reportData);
        this.priceReports.unshift(response);
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to create price report';
        throw err;
      }
    },

    async fetchBestRoutes() {
      try {
        const response = await TradeService.getBestRoutes();
        this.bestRoutes = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch best routes';
      }
    },

    // Cargo Contracts
    async fetchOpenContracts() {
      this.isLoading = true;
      try {
        const response = await TradeService.getOpenContracts();
        this.contracts = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch contracts';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchMyContracts() {
      try {
        const response = await TradeService.getMyContracts();
        this.myContracts = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch my contracts';
      }
    },

    async fetchMyHaulingContracts() {
      try {
        const response = await TradeService.getMyHaulingContracts();
        this.myHaulingContracts = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch hauling contracts';
      }
    },

    async createContract(contractData) {
      try {
        const response = await TradeService.createCargoContract(contractData);
        this.myContracts.unshift(response);
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to create contract';
        throw err;
      }
    },

    async acceptContract(contractId) {
      try {
        const response = await TradeService.acceptContract(contractId);
        // Update contract in lists
        const idx = this.contracts.findIndex(c => c.id === contractId);
        if (idx !== -1) {
          this.contracts[idx] = response;
        }
        this.myHaulingContracts.unshift(response);
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to accept contract';
        throw err;
      }
    },

    async completeContract(contractId) {
      try {
        const response = await TradeService.completeContract(contractId);
        // Update in all lists
        [this.contracts, this.myContracts, this.myHaulingContracts].forEach(list => {
          const idx = list.findIndex(c => c.id === contractId);
          if (idx !== -1) list[idx] = response;
        });
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to complete contract';
        throw err;
      }
    },

    async startContract(contractId) {
      try {
        const response = await TradeService.startContract(contractId);
        // Update in all lists
        [this.contracts, this.myContracts, this.myHaulingContracts].forEach(list => {
          const idx = list.findIndex(c => c.id === contractId);
          if (idx !== -1) list[idx] = response;
        });
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to start contract';
        throw err;
      }
    },

    async cancelContract(contractId) {
      try {
        const response = await TradeService.cancelContract(contractId);
        // Update in all lists
        [this.contracts, this.myContracts, this.myHaulingContracts].forEach(list => {
          const idx = list.findIndex(c => c.id === contractId);
          if (idx !== -1) list[idx] = response;
        });
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to cancel contract';
        throw err;
      }
    },

    async disputeContract(contractId) {
      try {
        const response = await TradeService.disputeContract(contractId);
        // Update in all lists
        [this.contracts, this.myContracts, this.myHaulingContracts].forEach(list => {
          const idx = list.findIndex(c => c.id === contractId);
          if (idx !== -1) list[idx] = response;
        });
        return response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to dispute contract';
        throw err;
      }
    },

    async fetchHaulerStats() {
      try {
        const response = await TradeService.getHaulerStats();
        this.haulerStats = response;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch hauler stats';
      }
    },
  }
});
