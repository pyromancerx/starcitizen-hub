import api from './api';

export default {
  // Trade Run Endpoints
  async createTradeRun(tradeRunData) {
    try {
      const response = await api.post('/trade/runs', tradeRunData);
      return response.data;
    } catch (error) {
      console.error('Error creating trade run:', error);
      throw error;
    }
  },

  async getMyTradeRuns(skip = 0, limit = 50) {
    try {
      const response = await api.get('/trade/runs', { params: { skip, limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching my trade runs:', error);
      throw error;
    }
  },

  async getAllTradeRuns(skip = 0, limit = 50) {
    try {
      const response = await api.get('/trade/runs/all', { params: { skip, limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching all trade runs:', error);
      throw error;
    }
  },

  async getTradeRun(runId) {
    try {
      const response = await api.get(`/trade/runs/${runId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching trade run ${runId}:`, error);
      throw error;
    }
  },

  async updateTradeRun(runId, tradeRunData) {
    try {
      const response = await api.put(`/trade/runs/${runId}`, tradeRunData);
      return response.data;
    } catch (error) {
      console.error(`Error updating trade run ${runId}:`, error);
      throw error;
    }
  },

  async deleteTradeRun(runId) {
    try {
      await api.delete(`/trade/runs/${runId}`);
    } catch (error) {
      console.error(`Error deleting trade run ${runId}:`, error);
      throw error;
    }
  },

  async getTradeLeaderboard(limit = 10) {
    try {
      const response = await api.get('/trade/leaderboard', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching trade leaderboard:', error);
      throw error;
    }
  },

  async getTradeStats() {
    try {
      const response = await api.get('/trade/stats/my');
      return response.data;
    } catch (error) {
      console.error('Error fetching trade stats:', error);
      throw error;
    }
  },

  // Price Report Endpoints
  async createPriceReport(priceReportData) {
    try {
      const response = await api.post('/trade/prices', priceReportData);
      return response.data;
    } catch (error) {
      console.error('Error creating price report:', error);
      throw error;
    }
  },

  async getPricesByLocation(location) {
    try {
      const response = await api.get(`/trade/prices/location/${location}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching prices for location ${location}:`, error);
      throw error;
    }
  },

  async getPriceHistory(location, commodity, days = 7) {
    try {
      const response = await api.get('/trade/prices/history', { params: { location, commodity, days } });
      return response.data;
    } catch (error) {
      console.error(`Error fetching price history for ${commodity} at ${location}:`, error);
      throw error;
    }
  },

  // Cargo Contract Endpoints
  async getPriceHistory(location, commodity, days = 7) {
    try {
      const response = await api.get('/trade/prices/history', { params: { location, commodity, days } });
      return response.data;
    } catch (error) {
      console.error(`Error fetching price history for ${commodity} at ${location}:`, error);
      throw error;
    }
  },

  async getPriceReports(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.location) params.append('location', filters.location);
      if (filters.commodity) params.append('commodity', filters.commodity);
      if (filters.skip) params.append('skip', filters.skip);
      if (filters.limit) params.append('limit', filters.limit);
      
      const response = await api.get(`/trade/prices?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching price reports:', error);
      throw error;
    }
  },

  async getBestRoutes(limit = 10) {
    try {
      const response = await api.get('/trade/routes/best', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching best trade routes:', error);
      throw error;
    }
  },

  // Cargo Contract Endpoints
  async createCargoContract(contractData) {
    try {
      const response = await api.post('/trade/contracts', contractData);
      return response.data;
    } catch (error) {
      console.error('Error creating cargo contract:', error);
      throw error;
    }
  },

  async getOpenContracts(skip = 0, limit = 50) {
    try {
      const response = await api.get('/trade/contracts/open', { params: { skip, limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching open contracts:', error);
      throw error;
    }
  },

  async getMyContracts() {
    try {
      const response = await api.get('/trade/contracts/my');
      return response.data;
    } catch (error) {
      console.error('Error fetching my contracts:', error);
      throw error;
    }
  },

  async getMyHaulingContracts() {
    try {
      const response = await api.get('/trade/contracts/hauling');
      return response.data;
    } catch (error) {
      console.error('Error fetching my hauling contracts:', error);
      throw error;
    }
  },

  async acceptContract(contractId) {
    try {
      const response = await api.post(`/trade/contracts/${contractId}/accept`);
      return response.data;
    } catch (error) {
      console.error(`Error accepting contract ${contractId}:`, error);
      throw error;
    }
  },

  async startContract(contractId) {
    try {
      const response = await api.post(`/trade/contracts/${contractId}/start`);
      return response.data;
    } catch (error) {
      console.error(`Error starting contract ${contractId}:`, error);
      throw error;
    }
  },

  async completeContract(contractId) {
    try {
      const response = await api.post(`/trade/contracts/${contractId}/complete`);
      return response.data;
    } catch (error) {
      console.error(`Error completing contract ${contractId}:`, error);
      throw error;
    }
  },

  async cancelContract(contractId) {
    try {
      const response = await api.post(`/trade/contracts/${contractId}/cancel`);
      return response.data;
    } catch (error) {
      console.error(`Error canceling contract ${contractId}:`, error);
      throw error;
    }
  },

  async getHaulerStats() {
    try {
      const response = await api.get('/trade/hauler/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching hauler stats:', error);
      throw error;
    }
  },

  async disputeContract(contractId) {
    try {
      const response = await api.post(`/trade/contracts/${contractId}/dispute`);
      return response.data;
    } catch (error) {
      console.error(`Error disputing contract ${contractId}:`, error);
      throw error;
    }
  },
};
