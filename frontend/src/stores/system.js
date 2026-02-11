import { defineStore } from 'pinia';
import SystemService from '../services/SystemService';

export const useSystemStore = defineStore('system', {
  state: () => ({
    settings: [],
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchAllSettings() {
      this.isLoading = true;
      try {
        this.settings = await SystemService.getAllSettings();
      } catch (error) {
        this.error = error;
        console.error('Failed to fetch all system settings:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchSetting(key) {
      this.isLoading = true;
      try {
        return await SystemService.getSetting(key);
      } catch (error) {
        this.error = error;
        console.error(`Failed to fetch system setting ${key}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async createSetting(settingData) {
      this.isLoading = true;
      try {
        const newSetting = await SystemService.createSetting(settingData);
        this.settings.push(newSetting);
        return newSetting;
      } catch (error) {
        this.error = error;
        console.error('Failed to create system setting:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateSetting(key, settingData) {
      this.isLoading = true;
      try {
        const updatedSetting = await SystemService.updateSetting(key, settingData);
        const index = this.settings.findIndex(s => s.key === key);
        if (index !== -1) {
          this.settings[index] = updatedSetting;
        }
        return updatedSetting;
      } catch (error) {
        this.error = error;
        console.error(`Failed to update system setting ${key}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteSetting(key) {
      this.isLoading = true;
      try {
        await SystemService.deleteSetting(key);
        this.settings = this.settings.filter(s => s.key !== key);
      } catch (error) {
        this.error = error;
        console.error(`Failed to delete system setting ${key}:`, error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async bulkUpdateSettings(settingsData) {
      this.isLoading = true;
      try {
        const updatedSettings = await SystemService.bulkUpdateSettings(settingsData);
        // Re-fetch all settings to ensure state is consistent after bulk update
        await this.fetchAllSettings(); 
        return updatedSettings;
      } catch (error) {
        this.error = error;
        console.error('Failed to bulk update system settings:', error);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
