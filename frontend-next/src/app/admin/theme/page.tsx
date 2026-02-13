'use client';

import React, { useState } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { 
  Palette, 
  Upload, 
  RefreshCw, 
  Check, 
  Image as ImageIcon,
  Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminThemePage() {
  const { settings, updateTheme, uploadLogo } = useThemeStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const themeColors = [
    { key: 'color_sc_dark', label: 'Primary Background' },
    { key: 'color_sc_panel', label: 'Panel Background' },
    { key: 'color_sc_blue', label: 'Accent Highlight' },
    { key: 'color_sc_light_blue', label: 'Secondary Accent' },
    { key: 'color_sc_grey', label: 'Text / Neutral' },
  ];

  const handleColorChange = async (key: string, value: string) => {
    setIsUpdating(true);
    try {
      await updateTheme({ [key]: value });
    } catch (error) {
      console.error('Update failed', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadLogo(file);
    } catch (error) {
      alert('Logo upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Logo Section */}
      <div className="bg-sc-panel border border-sc-grey/10 rounded p-8">
        <div className="flex items-center space-x-3 mb-8 border-b border-sc-grey/10 pb-4">
          <ImageIcon className="w-5 h-5 text-sc-blue" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Organizational Branding</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <div className="text-[10px] font-black text-sc-blue uppercase tracking-widest">Vessel Identifier (Logo)</div>
            <div className="h-40 w-40 bg-sc-dark border border-sc-blue/20 rounded flex items-center justify-center p-4 relative overflow-hidden group">
              {settings.logo_url ? (
                <img src={settings.logo_url} className="max-h-full max-w-full object-contain" alt="Org Logo" />
              ) : (
                <Rocket className="w-12 h-12 text-sc-grey/10" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-sc-dark/80 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-sc-blue animate-spin" />
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <label className="px-4 py-2 bg-sc-blue/10 border border-sc-blue/30 text-sc-blue text-[10px] font-black uppercase tracking-widest hover:bg-sc-blue/20 transition-all cursor-pointer flex items-center">
                <Upload className="w-3.5 h-3.5 mr-2" />
                Upload New Icon
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
              </label>
              <button 
                onClick={() => updateTheme({ logo_url: '' })}
                className="text-[10px] text-sc-grey/40 hover:text-red-400 font-bold uppercase tracking-widest"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-[10px] font-black text-sc-blue uppercase tracking-widest">Instance Designation (Name)</div>
            <input 
              defaultValue={settings.org_name}
              onBlur={(e) => handleColorChange('org_name', e.target.value)}
              className="w-full bg-sc-dark border border-sc-grey/20 rounded px-4 py-3 text-lg font-bold text-white uppercase italic tracking-tight focus:border-sc-blue/50 outline-none transition-all"
            />
            <p className="text-[10px] text-sc-grey/40 italic leading-relaxed">
              This name will be broadcasted as your primary instance identifier across the hub.
            </p>
          </div>
        </div>
      </div>

      {/* Colors Section */}
      <div className="bg-sc-panel border border-sc-grey/10 rounded p-8">
        <div className="flex items-center justify-between mb-8 border-b border-sc-grey/10 pb-4">
          <div className="flex items-center space-x-3">
            <Palette className="w-5 h-5 text-sc-blue" />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Visual Frequency Tuning</h3>
          </div>
          {isUpdating && <RefreshCw className="w-4 h-4 text-sc-blue animate-spin" />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {themeColors.map((color) => (
            <div key={color.key} className="flex items-center justify-between p-4 bg-sc-dark/50 border border-sc-grey/5 rounded hover:border-sc-blue/20 transition-all group">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-sc-grey/40 uppercase tracking-widest group-hover:text-sc-blue transition-colors">{color.label}</div>
                <div className="text-xs font-mono text-sc-grey/60">{(settings as any)[color.key]}</div>
              </div>
              <div className="relative h-10 w-10">
                <input 
                  type="color"
                  value={(settings as any)[color.key]}
                  onChange={(e) => handleColorChange(color.key, e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                />
                <div 
                  className="w-10 h-10 rounded border border-sc-grey/20 shadow-2xl"
                  style={{ backgroundColor: (settings as any)[color.key] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
