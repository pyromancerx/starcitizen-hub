import { create } from 'zustand';
import api from '@/lib/api';

interface ThemeSettings {
  color_sc_dark: string;
  color_sc_panel: string;
  color_sc_blue: string;
  color_sc_light_blue: string;
  color_sc_grey: string;
  logo_url: string | null;
  org_name: string;
}

interface ThemeState {
  settings: ThemeSettings;
  fetchTheme: () => Promise<void>;
  updateTheme: (newSettings: Partial<ThemeSettings>) => Promise<void>;
  uploadLogo: (file: File) => Promise<string>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  settings: {
    color_sc_dark: '#0b0c10',
    color_sc_panel: '#1f2833',
    color_sc_blue: '#66fcf1',
    color_sc_light_blue: '#45a29e',
    color_sc_grey: '#c5c6c7',
    logo_url: null,
    org_name: 'Star Citizen Hub',
  },

  fetchTheme: async () => {
    try {
      const response = await api.get('/admin/settings');
      const settingsList = response.data;
      const mapped: any = {};
      if (Array.isArray(settingsList)) {
        settingsList.forEach((s: any) => {
          mapped[s.key] = s.value;
        });
      }
      
      set((state) => ({
        settings: {
          ...state.settings,
          ...mapped,
        }
      }));

      // Apply colors to CSS variables
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        Object.entries(mapped).forEach(([key, value]) => {
          if (key.startsWith('color_sc_') && typeof value === 'string') {
            const varName = `--${key.replace(/_/g, '-')}-rgb`;
            // Convert hex to space-separated RGB for Tailwind v4 support
            const rgb = hexToRgb(value);
            if (rgb) {
              root.style.setProperty(varName, `${rgb.r} ${rgb.g} ${rgb.b}`);
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch theme settings:', error);
    }
  },

  updateTheme: async (newSettings) => {
    try {
      // For each changed setting, send update to backend
      for (const [key, value] of Object.entries(newSettings)) {
        await api.patch('/admin/settings', { key, value });
      }
      await get().fetchTheme();
    } catch (error) {
      console.error('Failed to update theme:', error);
      throw error;
    }
  },

  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post('/admin/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const logoUrl = response.data.logo_url;
    set((state) => ({ settings: { ...state.settings, logo_url: logoUrl } }));
    return logoUrl;
  },
}));

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}
