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
}

export const useThemeStore = create<ThemeState>((set) => ({
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
      // Map settings list to object if backend returns list, or use direct if object
      // For now assuming Go backend might return a key-value structure for some settings
      // or we can just fetch what we need.
      // Based on previous checks, /admin/settings returns a list of SystemSetting objects.
      
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
          // Overwrite with specifically named fields if they exist in mapped
          org_name: mapped.org_name || state.settings.org_name,
          logo_url: mapped.logo_url || state.settings.logo_url,
        }
      }));
    } catch (error) {
      console.error('Failed to fetch theme settings:', error);
    }
  },

  updateTheme: async (newSettings) => {
    // Implementation for updating settings via API
    set((state) => ({ settings: { ...state.settings, ...newSettings } }));
  },
}));
