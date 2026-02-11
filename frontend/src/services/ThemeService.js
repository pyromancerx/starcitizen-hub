import api from './api';

export default {
  async getThemeSettings() {
    try {
      const response = await api.get('/system/theme');
      return response.data;
    } catch (error) {
      console.error('Error fetching theme settings:', error);
      throw error;
    }
  },

  async updateThemeSettings(themeData) {
    try {
      const response = await api.put('/admin/system/theme', themeData);
      return response.data;
    } catch (error) {
      console.error('Error updating theme settings:', error);
      throw error;
    }
  },

  async uploadLogo(formData) {
    try {
      const response = await api.post('/admin/system/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  }
};
