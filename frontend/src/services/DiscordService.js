import api from './api';

export default {
  // Admin Settings
  async getDiscordSettings() {
    try {
      const response = await api.get('/discord/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching Discord settings:', error);
      throw error;
    }
  },

  async saveDiscordSettings(settingsData) {
    try {
      const response = await api.post('/discord/settings', settingsData);
      return response.data;
    } catch (error) {
      console.error('Error saving Discord settings:', error);
      throw error;
    }
  },

  async updateAutoPostSettings(settingsData) {
    try {
      const response = await api.put('/discord/settings/auto-post', settingsData);
      return response.data;
    } catch (error) {
      console.error('Error updating auto-post settings:', error);
      throw error;
    }
  },

  // Webhooks
  async createWebhook(webhookData) {
    try {
      const response = await api.post('/discord/webhooks', webhookData);
      return response.data;
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw error;
    }
  },

  async listWebhooks() {
    try {
      const response = await api.get('/discord/webhooks');
      return response.data;
    } catch (error) {
      console.error('Error listing webhooks:', error);
      throw error;
    }
  },

  async testWebhook(webhookId, message) {
    try {
      const response = await api.post(`/discord/webhooks/${webhookId}/test`, { message });
      return response.data;
    } catch (error) {
      console.error(`Error testing webhook ${webhookId}:`, error);
      throw error;
    }
  },

  async updateWebhook(webhookId, webhookData) {
    try {
      const response = await api.put(`/discord/webhooks/${webhookId}`, webhookData);
      return response.data;
    } catch (error) {
      console.error(`Error updating webhook ${webhookId}:`, error);
      throw error;
    }
  },

  async deleteWebhook(webhookId) {
    try {
      await api.delete(`/discord/webhooks/${webhookId}`);
    } catch (error) {
      console.error(`Error deleting webhook ${webhookId}:`, error);
      throw error;
    }
  },

  // User OAuth/Linking
  async getDiscordLoginUrl() {
    try {
      const response = await api.get('/discord/login-url');
      return response.data;
    } catch (error) {
      console.error('Error getting Discord login URL:', error);
      throw error;
    }
  },

  async getMyDiscordLink() {
    try {
      const response = await api.get('/discord/my-link');
      return response.data;
    } catch (error) {
      console.error('Error getting user Discord link:', error);
      throw error;
    }
  },

  async unlinkDiscord() {
    try {
      await api.delete('/discord/my-link');
    } catch (error) {
      console.error('Error unlinking Discord account:', error);
      throw error;
    }
  },

  // Role Mappings
  async createRoleMapping(mappingData) {
    try {
      const response = await api.post('/discord/role-mappings', mappingData);
      return response.data;
    } catch (error) {
      console.error('Error creating role mapping:', error);
      throw error;
    }
  },

  async listRoleMappings() {
    try {
      const response = await api.get('/discord/role-mappings');
      return response.data;
    } catch (error) {
      console.error('Error listing role mappings:', error);
      throw error;
    }
  },

  async updateRoleMapping(mappingId, mappingData) {
    try {
      const response = await api.put(`/discord/role-mappings/${mappingId}`, mappingData);
      return response.data;
    } catch (error) {
      console.error(`Error updating role mapping ${mappingId}:`, error);
      throw error;
    }
  },

  async deleteRoleMapping(mappingId) {
    try {
      await api.delete(`/discord/role-mappings/${mappingId}`);
    } catch (error) {
      console.error(`Error deleting role mapping ${mappingId}:`, error);
      throw error;
    }
  },

  // Role Sync
  async syncUserRoles(userId) {
    try {
      const response = await api.post(`/discord/sync-roles/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error syncing roles for user ${userId}:`, error);
      throw error;
    }
  },

  async syncMyRoles() {
    try {
      const response = await api.post('/discord/sync-my-roles');
      return response.data;
    } catch (error) {
      console.error('Error syncing my roles:', error);
      throw error;
    }
  },
};
