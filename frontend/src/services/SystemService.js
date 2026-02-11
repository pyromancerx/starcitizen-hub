import api from './api';

export default {
  async getAllSettings(isPublic = null) {
    try {
      const params = new URLSearchParams();
      if (isPublic !== null) params.append('is_public', isPublic);
      const response = await api.get(`/admin/system/settings?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching all system settings:', error);
      throw error;
    }
  },

  async getSetting(key) {
    try {
      const response = await api.get(`/admin/system/settings/${key}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching system setting ${key}:`, error);
      throw error;
    }
  },

  async createSetting(settingData) {
    try {
      const response = await api.post('/admin/system/settings', settingData);
      return response.data;
    } catch (error) {
      console.error('Error creating system setting:', error);
      throw error;
    }
  },

  async updateSetting(key, settingData) {
    try {
      const response = await api.patch(`/admin/system/settings/${key}`, settingData);
      return response.data;
    } catch (error) {
      console.error(`Error updating system setting ${key}:`, error);
      throw error;
    }
  },

  async deleteSetting(key) {
    try {
      await api.delete(`/admin/system/settings/${key}`);
    } catch (error) {
      console.error(`Error deleting system setting ${key}:`, error);
      throw error;
    }
  },

  async bulkUpdateSettings(settingsData) {
    try {
      const response = await api.put('/admin/system/bulk-settings', settingsData);
      return response.data;
    } catch (error) {
      console.error('Error bulk updating system settings:', error);
      throw error;
    }
  },
};
