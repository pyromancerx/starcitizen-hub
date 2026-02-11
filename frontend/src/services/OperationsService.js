import api from './api';

export default {
  async getOperations() {
    try {
      const response = await api.get('/operations/');
      return response.data;
    } catch (error) {
      console.error('Error fetching operations:', error);
      throw error;
    }
  },

  async getOperation(id) {
    try {
      const response = await api.get(`/operations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching operation ${id}:`, error);
      throw error;
    }
  },

  async createOperation(operationData) {
    try {
      const response = await api.post('/operations/', operationData);
      return response.data;
    } catch (error) {
      console.error('Error creating operation:', error);
      throw error;
    }
  },

  async updateOperation(id, operationData) {
    try {
      const response = await api.put(`/operations/${id}`, operationData);
      return response.data;
    } catch (error) {
      console.error(`Error updating operation ${id}:`, error);
      throw error;
    }
  },

  async deleteOperation(id) {
    try {
      await api.delete(`/operations/${id}`);
    } catch (error) {
      console.error(`Error deleting operation ${id}:`, error);
      throw error;
    }
  },

  async signupForOperation(id, signupData = {}) {
    try {
      const response = await api.post(`/operations/${id}/signup`, signupData);
      return response.data;
    } catch (error) {
      console.error(`Error signing up for operation ${id}:`, error);
      throw error;
    }
  },

  async cancelSignup(id) {
    try {
      const response = await api.post(`/operations/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error(`Error canceling signup for operation ${id}:`, error);
      throw error;
    }
  },
};
