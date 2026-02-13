'use client';

import React, { useState, useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { 
  Palette, 
  Upload, 
  RefreshCw, 
  Check, 
  Image as ImageIcon,
  Rocket,
  Save,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminThemePage() {
  const { settings, updateTheme, uploadLogo, fetchTheme } = useThemeStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Local state for form values to allow explicit saving
  const [formValues, setFormValues] = useState({
    org_name: '',
    color_sc_dark: '',
    color_sc_panel: '',
    color_sc_blue: '',
    color_sc_light_blue: '',
    color_sc_grey: '',
  });

  useEffect(() => {
    fetchTheme();
  }, []);

  useEffect(() => {
    setFormValues({
      org_name: settings.org_name || '',
      color_sc_dark: settings.color_sc_dark || '#0b0c10',
      color_sc_panel: settings.color_sc_panel || '#1f2833',
      color_sc_blue: settings.color_sc_blue || '#66fcf1',
      color_sc_light_blue: settings.color_sc_light_blue || '#45a29e',
      color_sc_grey: settings.color_sc_grey || '#c5c6c7',
    });
  }, [settings]);

  const handleSave = async () => {
    setIsUpdating(true);
    setSuccess(false);
    try {
      await updateTheme(formValues);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Update failed', error);
      alert('Transmission failed. Check system logs.');
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
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert('Logo upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const themeColors = [
    { key: 'color_sc_dark', label: 'Primary Background' },
    { key: 'color_sc_panel', label: 'Panel Background' },
    { key: 'color_sc_blue', label: 'Accent Highlight' },
    { key: 'color_sc_light_blue', label: 'Secondary Accent' },
    { key: 'color_sc_grey', label: 'Text / Neutral' },
  ];

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div className="flex justify-between items-center bg-sc-panel/50 border border-sc-blue/20 p-4 rounded-lg sticky top-20 z-30 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <div className={cn(
            "h-2 w-2 rounded-full",
            success ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-sc-blue animate-pulse shadow-[0_0_8px_#66fcf1]"
          )} />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">
            {success ? 'Configuration Synchronized' : 'Visual Calibration Active'}
          </span>
        </div>
        <button 
          onClick={handleSave}
          disabled={isUpdating}
          className="px-8 py-2 bg-sc-blue text-sc-dark text-xs font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.3)] flex items-center disabled:opacity-50"
        >
          {isUpdating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Finalize Changes
        </button>
      </div>

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
              value={formValues.org_name}
              onChange={(e) => setFormValues({...formValues, org_name: e.target.value})}
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {themeColors.map((color) => (
            <div key={color.key} className="flex items-center justify-between p-4 bg-sc-dark/50 border border-sc-grey/5 rounded hover:border-sc-blue/20 transition-all group">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-sc-grey/40 uppercase tracking-widest group-hover:text-sc-blue transition-colors">{color.label}</div>
                <div className="text-xs font-mono text-sc-grey/60">{(formValues as any)[color.key]}</div>
              </div>
              <div className="relative h-10 w-10">
                <input 
                  type="color"
                  value={(formValues as any)[color.key]}
                  onChange={(e) => setFormValues({...formValues, [color.key]: e.target.value})}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                />
                <div 
                  className="w-10 h-10 rounded border border-sc-grey/20 shadow-2xl"
                  style={{ backgroundColor: (formValues as any)[color.key] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 border border-yellow-500/20 bg-yellow-500/5 rounded-lg flex items-start space-x-4">
        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
        <div className="space-y-1">
          <h4 className="text-xs font-black text-white uppercase tracking-widest">Warning: Visual Overhaul</h4>
          <p className="text-[10px] text-sc-grey/60 leading-relaxed uppercase font-bold tracking-widest">
            Changes to the visual frequency will be applied system-wide immediately after synchronization. Ensure accessibility standards are maintained.
          </p>
        </div>
      </div>
    </div>
  );
}