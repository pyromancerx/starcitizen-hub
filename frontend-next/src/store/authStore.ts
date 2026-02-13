import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: number;
  email: string;
  display_name: string;
  rsi_handle: string;
  roles: any[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isLoading: false,
  isInitialized: false,
  error: null,
  isAuthenticated: false, // Start false, verify in initialize

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // ... same login logic
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      set({ token: access_token, isAuthenticated: true, isInitialized: true });
      
      await get().fetchUser();
    } catch (err: any) {
      set({ 
        error: err.response?.data?.detail || err.response?.data || 'Login failed', 
        isAuthenticated: false 
      });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data, isAuthenticated: true });
    } catch (err) {
      get().logout();
    }
  },

  initialize: async () => {
    if (get().isInitialized) return;
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      set({ token });
      await get().fetchUser();
    }
    set({ isInitialized: true });
  },
}));
