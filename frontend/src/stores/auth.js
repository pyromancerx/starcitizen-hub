import { defineStore } from 'pinia';
import api from '../services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isLoading: false,
    error: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async login(email, password) {
      this.isLoading = true;
      this.error = null;
      try {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        
        const response = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        this.token = response.data.access_token;
        localStorage.setItem('token', this.token);
        
        // Fetch user details
        // We don't have a direct "me" endpoint yet, but we can assume we might add one
        // or decode the token if needed. For now, let's just set authenticated.
        // Ideally: await this.fetchUser();
      } catch (err) {
        this.error = err.response?.data?.detail || 'Login failed';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },
    
    async fetchUser() {
      if (!this.token) return;
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get('/users/me');
        this.user = response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to fetch user data';
        this.logout(); // Logout if fetching user fails (e.g., token expired)
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async updateProfile(userData) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.patch('/users/me', userData);
        this.user = response.data; // Update local user state
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to update profile';
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
    },
  },
});
