import { defineStore } from 'pinia';
import api from '../services/api';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    totalCount: 0,
    hasMore: false,
    isLoading: false,
    error: null,
    preferences: null,
    pollingInterval: null,
  }),
  actions: {
    async fetchNotifications(params = {}) {
      this.isLoading = true;
      try {
        const queryParams = new URLSearchParams();
        if (params.unread_only) queryParams.append('unread_only', 'true');
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.offset) queryParams.append('offset', params.offset);
        
        const response = await api.get(`/notifications/?${queryParams}`);
        
        if (params.offset && params.offset > 0) {
          this.notifications = [...this.notifications, ...response.data.notifications];
        } else {
          this.notifications = response.data.notifications;
        }
        
        this.unreadCount = response.data.unread_count;
        this.totalCount = response.data.total_count;
        this.hasMore = response.data.has_more;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch notifications';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchUnreadCount() {
      try {
        const response = await api.get('/notifications/unread-count');
        this.unreadCount = response.data.count;
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    },

    async markAsRead(notificationIds = null) {
      try {
        await api.post('/notifications/mark-read', { notification_ids: notificationIds });
        
        if (notificationIds) {
          // Mark specific notifications as read
          notificationIds.forEach(id => {
            const notification = this.notifications.find(n => n.id === id);
            if (notification) {
              notification.is_read = true;
              notification.read_at = new Date().toISOString();
            }
          });
          this.unreadCount = Math.max(0, this.unreadCount - notificationIds.length);
        } else {
          // Mark all as read
          this.notifications.forEach(n => {
            n.is_read = true;
            n.read_at = new Date().toISOString();
          });
          this.unreadCount = 0;
        }
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to mark as read';
        throw err;
      }
    },

    async deleteNotification(notificationId) {
      try {
        await api.delete(`/notifications/${notificationId}`);
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.is_read) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.totalCount = Math.max(0, this.totalCount - 1);
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to delete notification';
        throw err;
      }
    },

    async deleteAllRead() {
      try {
        await api.delete('/notifications/');
        const readCount = this.notifications.filter(n => n.is_read).length;
        this.notifications = this.notifications.filter(n => !n.is_read);
        this.totalCount = this.notifications.length;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to delete read notifications';
        throw err;
      }
    },

    async fetchPreferences() {
      try {
        const response = await api.get('/notifications/preferences/me');
        this.preferences = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch preferences';
      }
    },

    async updatePreferences(preferencesData) {
      try {
        const response = await api.put('/notifications/preferences/me', preferencesData);
        this.preferences = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to update preferences';
        throw err;
      }
    },

    async enableNotificationType(type) {
      try {
        await api.post(`/notifications/preferences/me/enable/${type}`);
        if (this.preferences && this.preferences.disabled_types) {
          this.preferences.disabled_types = this.preferences.disabled_types.filter(t => t !== type);
        }
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to enable notification type';
        throw err;
      }
    },

    async disableNotificationType(type) {
      try {
        await api.post(`/notifications/preferences/me/disable/${type}`);
        if (this.preferences) {
          if (!this.preferences.disabled_types) {
            this.preferences.disabled_types = [];
          }
          if (!this.preferences.disabled_types.includes(type)) {
            this.preferences.disabled_types.push(type);
          }
        }
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to disable notification type';
        throw err;
      }
    },

    startPolling(intervalMs = 30000) {
      this.stopPolling();
      this.pollingInterval = setInterval(() => {
        this.fetchUnreadCount();
      }, intervalMs);
    },

    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    },

    clearNotifications() {
      this.notifications = [];
      this.unreadCount = 0;
      this.totalCount = 0;
      this.hasMore = false;
    },
  }
});
