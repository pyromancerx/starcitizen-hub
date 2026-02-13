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
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isLoading: false,
  error: null,
  isAuthenticated: !!(typeof window !== 'undefined' && localStorage.getItem('token')),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // Standard OAuth2 flow as expected by the Go backend's updated Login handler
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      set({ token: access_token, isAuthenticated: true });
      
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
    if (!get().token) return;
    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data });
    } catch (err) {
      get().logout();
    } finally {
      set({ isLoading: false });
    }
  },
}));
