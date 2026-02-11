import api from './api';

export default {
  async getAllRoles() {
    try {
      const response = await api.get('/roles/');
      return response.data;
    } catch (error) {
      console.error('Error fetching all roles:', error);
      throw error;
    }
  },
};
