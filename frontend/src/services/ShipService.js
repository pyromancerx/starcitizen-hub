import api from './api';

export default {
  async getMyShips() {
    try {
      const response = await api.get('/ships/');
      return response.data;
    } catch (error) {
      console.error('Error fetching user ships:', error);
      throw error;
    }
  },
};
