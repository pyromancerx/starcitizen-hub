import { defineStore } from 'pinia';
import api from '../services/api';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    settings: {
      color_sc_dark: '#0b0c10',
      color_sc_panel: '#1f2833',
      color_sc_blue: '#66fcf1',
      color_sc_light_blue: '#45a29e',
      color_sc_grey: '#c5c6c7',
      logo_url: null,
      org_name: 'Star Citizen Hub'
    },
    isLoading: false
  }),
  actions: {
    async fetchTheme() {
      try {
        const response = await api.get('/system/theme');
        this.settings = response.data;
        this.applyTheme();
      } catch (err) {
        console.error('Failed to fetch theme', err);
      }
    },
    async updateTheme(newSettings) {
      try {
        const response = await api.put('/admin/system/theme', newSettings);
        this.settings = response.data;
        this.applyTheme();
      } catch (err) {
        throw err;
      }
    },
    async uploadLogo(formData) {
      try {
        const response = await api.post('/admin/system/upload-logo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      } catch (err) {
        throw err;
      }
    },
    applyTheme() {
      const root = document.documentElement;
      root.style.setProperty('--color-sc-dark', this.settings.color_sc_dark);
      root.style.setProperty('--color-sc-panel', this.settings.color_sc_panel);
      root.style.setProperty('--color-sc-blue', this.settings.color_sc_blue);
      root.style.setProperty('--color-sc-light-blue', this.settings.color_sc_light_blue);
      root.style.setProperty('--color-sc-grey', this.settings.color_sc_grey);
      
      // Update document title if org name changed
      document.title = this.settings.org_name || 'Star Citizen Hub';
    }
  }
});
