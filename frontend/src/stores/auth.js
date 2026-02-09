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
    
    async register(email, password, rsiHandle) {
        this.isLoading = true;
        this.error = null;
        try {
            await api.post('/auth/register', {
                email,
                password,
                rsi_handle: rsiHandle
            });
        } catch (err) {
            this.error = err.response?.data?.detail || 'Registration failed';
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
