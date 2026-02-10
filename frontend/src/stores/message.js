import { defineStore } from 'pinia';
import api from '../services/api';

export const useMessageStore = defineStore('message', {
  state: () => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    pollingInterval: null,
  }),
  actions: {
    async fetchConversations() {
      this.isLoading = true;
      try {
        const response = await api.get('/messages/conversations');
        this.conversations = response.data.conversations;
        this.unreadCount = response.data.total_unread;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch conversations';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchConversation(conversationId) {
      this.isLoading = true;
      try {
        const response = await api.get(`/messages/conversations/${conversationId}`);
        this.currentConversation = response.data;
        this.messages = response.data.messages;
        // Update unread count after marking as read
        await this.fetchUnreadCount();
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch conversation';
      } finally {
        this.isLoading = false;
      }
    },

    async sendMessage(recipientId, content) {
      try {
        const response = await api.post('/messages/send', {
          recipient_id: recipientId,
          content,
        });
        
        // If we're in a conversation, add the message
        if (this.currentConversation) {
          this.messages.push(response.data);
        }
        
        // Refresh conversations list
        await this.fetchConversations();
        
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to send message';
        throw err;
      }
    },

    async markAsRead(conversationId, messageIds = null) {
      try {
        await api.post(`/messages/conversations/${conversationId}/read`, {
          message_ids: messageIds,
        });
        
        // Update local messages
        if (messageIds) {
          messageIds.forEach(id => {
            const msg = this.messages.find(m => m.id === id);
            if (msg) msg.is_read = true;
          });
        } else {
          this.messages.forEach(m => m.is_read = true);
        }
        
        await this.fetchUnreadCount();
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to mark as read';
      }
    },

    async fetchUnreadCount() {
      try {
        const response = await api.get('/messages/unread-count');
        this.unreadCount = response.data.total_unread;
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    },

    async deleteConversation(conversationId) {
      try {
        await api.delete(`/messages/conversations/${conversationId}`);
        this.conversations = this.conversations.filter(c => c.id !== conversationId);
        if (this.currentConversation?.id === conversationId) {
          this.currentConversation = null;
          this.messages = [];
        }
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to delete conversation';
        throw err;
      }
    },

    startPolling(intervalMs = 10000) {
      this.stopPolling();
      this.pollingInterval = setInterval(() => {
        this.fetchUnreadCount();
        if (this.currentConversation) {
          this.fetchConversation(this.currentConversation.id);
        } else {
          this.fetchConversations();
        }
      }, intervalMs);
    },

    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    },

    clearCurrentConversation() {
      this.currentConversation = null;
      this.messages = [];
    },
  }
});
