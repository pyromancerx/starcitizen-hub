import api from './api';

export default {
  async getAnnouncements() {
    try {
      const response = await api.get('/announcements/');
      return response.data;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
  },

  async getAnnouncement(id) {
    try {
      const response = await api.get(`/announcements/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching announcement ${id}:`, error);
      throw error;
    }
  },

  async createAnnouncement(announcementData) {
    try {
      const response = await api.post('/announcements/', announcementData);
      return response.data;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  },

  async updateAnnouncement(id, announcementData) {
    try {
      const response = await api.put(`/announcements/${id}`, announcementData);
      return response.data;
    } catch (error) {
      console.error(`Error updating announcement ${id}:`, error);
      throw error;
    }
  },

  async deleteAnnouncement(id) {
    try {
      await api.delete(`/announcements/${id}`);
    } catch (error) {
      console.error(`Error deleting announcement ${id}:`, error);
      throw error;
    }
  },

  async getPublicAnnouncements() {
    try {
      const response = await api.get('/announcements/public');
      return response.data;
    } catch (error) {
      console.error('Error fetching public announcements:', error);
      throw error;
    }
  },
};
