import { defineStore } from 'pinia';
import api from '../services/api';

export const useEventStore = defineStore('events', {
  state: () => ({
    events: [],
    currentEvent: null,
    categories: [],
    threads: [],
    currentThread: null,
    isLoading: false,
    error: null,
  }),
  actions: {
    async fetchEvents() {
      this.isLoading = true;
      try {
        const response = await api.get('/events/');
        this.events = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch events';
      } finally {
        this.isLoading = false;
      }
    },
    async addEvent(eventData) {
      try {
        const response = await api.post('/events/', eventData);
        await this.fetchEvents(); // Refresh the list to include the new event
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to add event';
        throw err;
      }
    },
    async fetchEvent(eventId) {
      this.isLoading = true;
      try {
        const response = await api.get(`/events/${eventId}`);
        this.currentEvent = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch event details';
      } finally {
        this.isLoading = false;
      }
    },
    async signup(eventId, role) {
      try {
        await api.post(`/events/${eventId}/signup`, { role });
        await this.fetchEvent(eventId);
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to sign up';
        throw err;
      }
    },
    // --- Forum Actions ---
    async fetchCategories() {
      this.isLoading = true;
      try {
        const response = await api.get('/forum/categories');
        this.categories = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch forum categories';
      } finally {
        this.isLoading = false;
      }
    },
    async fetchThreads(categoryId) {
      this.isLoading = true;
      try {
        const response = await api.get(`/forum/categories/${categoryId}/threads`);
        this.threads = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch threads';
      } finally {
        this.isLoading = false;
      }
    },
    async fetchThreadDetail(threadId) {
      this.isLoading = true;
      try {
        const response = await api.get(`/forum/threads/${threadId}`);
        this.currentThread = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch thread details';
      } finally {
        this.isLoading = false;
      }
    }
  }
});
