import { defineStore } from 'pinia';
import ThemeService from '../services/ThemeService';

export const useThemeStore = defineStore('theme', {
  state: () => ({
    settings: {
      color_sc_dark: '#0b0c10',
      color_sc_panel: '#1f2833',
      color_sc_blue: '#66fcf1',
      color_sc_light_blue: '#45a29e',
      color_sc_grey: '#c5c6c7',
      logo_url: null,
      org_name: 'Star Citizen Hub',
    },
  }),
  actions: {
    async fetchTheme() {
      try {
        const data = await ThemeService.getThemeSettings();
        this.settings = { ...this.settings, ...data };
      } catch (error) {
        console.error('Failed to fetch theme settings:', error);
      }
    },
    async updateTheme(newSettings) {
      try {
        const data = await ThemeService.updateThemeSettings(newSettings);
        this.settings = { ...this.settings, ...data };
        alert('Theme updated successfully!');
      } catch (error) {
        console.error('Failed to update theme settings:', error);
        alert('Failed to update theme settings.');
        throw error; // Re-throw to allow component to handle
      }
    },
    async uploadLogo(formData) {
      try {
        const response = await ThemeService.uploadLogo(formData);
        this.settings.logo_url = response.url;
        alert('Logo uploaded successfully!');
        return response;
      } catch (error) {
        console.error('Failed to upload logo:', error);
        alert('Failed to upload logo.');
        throw error; // Re-throw to allow component to handle
      }
    },
  },
  getters: {
    logoUrl: (state) => state.settings.logo_url,
    orgName: (state) => state.settings.org_name,
    // Add other getters if needed for individual color values, etc.
  },
});