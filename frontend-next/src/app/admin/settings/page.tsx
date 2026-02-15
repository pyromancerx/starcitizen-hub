'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Settings, 
  Save,
  RefreshCw,
  AlertCircle,
  Cpu,
  ArrowUpCircle,
  Palette,
  Upload,
  Database,
  Download,
  Terminal,
  Activity,
  Mail,
  Send,
  ShieldCheck,
  Binary,
  Combine,
  Link2,
  Unlink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/store/themeStore';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { settings: themeSettings, uploadLogo } = useThemeStore();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await api.get('/admin/settings');
      return res.data;
    },
  });

  const syncGameDataMutation = useMutation({
    mutationFn: async () => {
      return api.post('/admin/system/sync-game-data');
    },
    onSuccess: (res) => {
        alert(res.data.status || 'Synchronization sequence initiated.');
    },
  });

  const syncRSIMutation = useMutation({
    mutationFn: async () => {
      return api.post('/admin/system/sync-rsi');
    },
    onSuccess: (res) => {
        alert(res.data.status || 'RSI synchronization initiated.');
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      return api.post('/admin/system/test-email');
    },
    onSuccess: (res) => {
        alert(res.data.status || 'Test transmission successful!');
    },
    onError: (err: any) => {
        alert('Failed to send test signal: ' + (err.response?.data || err.message));
    }
  });

  const { data: versionInfo } = useQuery({
    queryKey: ['system-version'],
    queryFn: async () => {
      const res = await api.get('/admin/system/version');
      return res.data;
    },
  });

  const { data: systemLogs } = useQuery({
    queryKey: ['system-logs'],
    queryFn: async () => {
      const res = await api.get('/admin/system/logs');
      return res.data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const updateSystemMutation = useMutation({
    mutationFn: async () => {
      return api.post('/admin/system/update');
    },
    onSuccess: () => {
        alert('System update initiated. The hub will restart shortly.');
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: string }) => {
      return api.patch('/admin/settings', { key, value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      // Also refresh the global theme store to apply changes immediately
      useThemeStore.getState().fetchTheme();
    },
  });

  return (
    <section className="max-w-4xl space-y-6">
      {/* Access Control & Enrollment */}
      <div className="bg-sc-panel border border-sc-blue/20 p-6 rounded relative overflow-hidden shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.05)]">
        <div className="flex items-center space-x-3 mb-6 border-b border-sc-grey/10 pb-4">
          <ShieldCheck className="w-5 h-5 text-sc-blue" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Access Control & Enrollment</h3>
        </div>

        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 group">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Public Registration</label>
                    <p className="text-[10px] text-sc-grey/40 italic">Allow new users to create accounts via the login page.</p>
                </div>
                <div className="md:col-span-2 flex items-center space-x-4">
                    <button 
                        onClick={() => {
                            const current = settings?.find((s: any) => s.key === 'allow_public_signup')?.value === 'true';
                            updateSettingMutation.mutate({ key: 'allow_public_signup', value: (!current).toString() });
                        }}
                        className={cn(
                            "px-6 py-2 rounded text-[10px] font-black uppercase tracking-widest border transition-all",
                            settings?.find((s: any) => s.key === 'allow_public_signup')?.value === 'true'
                                ? "bg-green-500/10 border-green-500 text-green-500"
                                : "bg-red-500/10 border-red-500 text-red-500"
                        )}
                    >
                        {settings?.find((s: any) => s.key === 'allow_public_signup')?.value === 'true' ? 'Enabled' : 'Disabled'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 group">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Administrative Approval</label>
                    <p className="text-[10px] text-sc-grey/40 italic">Require manual authorization for all new registrations.</p>
                </div>
                <div className="md:col-span-2 flex items-center space-x-4">
                    <button 
                        onClick={() => {
                            const current = settings?.find((s: any) => s.key === 'require_admin_approval')?.value === 'true';
                            updateSettingMutation.mutate({ key: 'require_admin_approval', value: (!current).toString() });
                        }}
                        className={cn(
                            "px-6 py-2 rounded text-[10px] font-black uppercase tracking-widest border transition-all",
                            settings?.find((s: any) => s.key === 'require_admin_approval')?.value === 'true'
                                ? "bg-sc-blue/10 border-sc-blue text-sc-blue"
                                : "bg-white/5 border-white/10 text-sc-grey/40"
                        )}
                    >
                        {settings?.find((s: any) => s.key === 'require_admin_approval')?.value === 'true' ? 'Mandatory' : 'Bypassed'}
                    </button>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-sc-panel border border-sc-blue/20 p-6 rounded relative overflow-hidden shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.05)]">
        <div className="flex items-center space-x-3 mb-6 border-b border-sc-grey/10 pb-4">
          <Settings className="w-5 h-5 text-sc-blue" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Global System Parameters</h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sc-grey/40 uppercase tracking-widest text-[10px] font-mono animate-pulse">
            Accessing kernel configuration...
          </div>
        ) : (
          <div className="space-y-8">
            {settings?.map((setting: any) => (
              <div key={setting.key} className="grid grid-cols-1 md:grid-cols-3 gap-6 group">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">{setting.key.replace(/_/g, ' ')}</label>
                  <p className="text-[10px] text-sc-grey/40 italic leading-relaxed">{setting.description || 'System-critical parameter.'}</p>
                </div>
                <div className="md:col-span-2 flex items-center space-x-3">
                  <input 
                    defaultValue={setting.value}
                    onBlur={(e) => {
                      if (e.target.value !== setting.value) {
                        updateSettingMutation.mutate({ key: setting.key, value: e.target.value });
                      }
                    }}
                    className="flex-1 bg-black/40 border border-sc-grey/20 rounded px-4 py-2 text-sm text-white focus:outline-none focus:border-sc-blue/50 transition-all font-mono"
                  />
                  <div className="w-8 h-8 flex items-center justify-center">
                    {updateSettingMutation.isPending && updateSettingMutation.variables?.key === setting.key ? (
                      <RefreshCw className="w-4 h-4 text-sc-blue animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 text-sc-grey/20 group-hover:text-sc-blue/40 transition-colors" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-6 border-t border-sc-grey/10 flex items-start space-x-3 opacity-40">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
              <p className="text-[9px] text-sc-grey uppercase tracking-widest font-bold">
                Caution: Modifying these parameters may affect system-wide synchronization and security protocols.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Organization Branding Section */}
      <div className="bg-sc-panel border border-sc-blue/20 p-6 rounded relative overflow-hidden shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.05)]">
        <div className="flex items-center space-x-3 mb-6 border-b border-sc-grey/10 pb-4">
          <Palette className="w-5 h-5 text-sc-blue" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Organization Branding</h3>
        </div>

        <div className="space-y-8">
            {/* Logo Upload */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Institutional Logo</label>
                    <p className="text-[10px] text-sc-grey/40 italic">Primary insignia for the hub interface.</p>
                </div>
                <div className="md:col-span-2 flex items-center space-x-6">
                    <div className="h-20 w-20 bg-black/40 border border-sc-grey/10 rounded flex items-center justify-center overflow-hidden">
                        {themeSettings.logo_url ? (
                            <img src={themeSettings.logo_url} className="max-h-full max-w-full object-contain" alt="Preview" />
                        ) : (
                            <Settings className="w-8 h-8 text-sc-grey/20" />
                        )}
                    </div>
                    <label className="cursor-pointer bg-sc-blue/10 border border-sc-blue/30 px-4 py-2 rounded text-[10px] font-black text-sc-blue uppercase tracking-widest hover:bg-sc-blue hover:text-sc-dark transition-all flex items-center space-x-2">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Insignia</span>
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={async (e) => {
                                if (e.target.files?.[0]) {
                                    await uploadLogo(e.target.files[0]);
                                    queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
                                }
                            }}
                        />
                    </label>
                </div>
            </div>

            {/* Colors & Custom CSS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Interface Palette</label>
                    <p className="text-[10px] text-sc-grey/40 italic">Global CSS variables for accent and background tones.</p>
                </div>
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    {['color_sc_blue', 'color_sc_dark', 'color_sc_panel'].map((key) => (
                        <div key={key} className="space-y-2">
                            <label className="text-[9px] font-bold text-sc-grey/60 uppercase">{key.replace(/_/g, ' ')}</label>
                            <div className="flex items-center space-x-2">
                                <input 
                                    type="color"
                                    defaultValue={themeSettings[key as keyof typeof themeSettings] as string}
                                    onChange={(e) => updateSettingMutation.mutate({ key, value: e.target.value })}
                                    className="w-10 h-10 bg-transparent border-none cursor-pointer"
                                />
                                <input 
                                    defaultValue={themeSettings[key as keyof typeof themeSettings] as string}
                                    onBlur={(e) => updateSettingMutation.mutate({ key, value: e.target.value })}
                                    className="flex-1 bg-black/40 border border-sc-grey/20 rounded px-3 py-2 text-xs text-white font-mono uppercase"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Neural Override (Custom CSS)</label>
                    <p className="text-[10px] text-sc-grey/40 italic leading-relaxed uppercase tracking-tighter">Inject raw CSS to override core interface modules. Use with caution.</p>
                </div>
                <textarea 
                    defaultValue={themeSettings.custom_css}
                    onBlur={(e) => updateSettingMutation.mutate({ key: 'custom_css', value: e.target.value })}
                    rows={6}
                    className="w-full bg-black/40 border border-sc-grey/20 rounded p-4 text-xs text-sc-blue font-mono focus:outline-none focus:border-sc-blue/50 transition-all custom-scrollbar"
                    placeholder="/* Enter custom CSS overrides here */"
                />
            </div>
        </div>
      </div>

      {/* Email Integration (SMTP) */}
      <div className="bg-sc-panel border border-sc-blue/20 p-6 rounded relative overflow-hidden shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.05)]">
        <div className="flex items-center justify-between mb-6 border-b border-sc-grey/10 pb-4">
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-sc-blue" />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Email Integration (SMTP)</h3>
          </div>
          <button 
            onClick={() => testEmailMutation.mutate()}
            disabled={testEmailMutation.isPending}
            className="flex items-center space-x-2 px-4 py-1.5 bg-sc-blue/10 border border-sc-blue/30 text-sc-blue text-[9px] font-black rounded uppercase hover:bg-sc-blue hover:text-sc-dark transition-all disabled:opacity-20"
          >
            <Send className={cn("w-3 h-3", testEmailMutation.isPending && "animate-ping")} />
            <span>{testEmailMutation.isPending ? 'Transmitting...' : 'Send Test Transmission'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                {['smtp_host', 'smtp_port', 'smtp_from'].map((key) => {
                    const setting = settings?.find((s: any) => s.key === key);
                    return (
                        <div key={key} className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">{key.replace(/_/g, ' ')}</label>
                            <input 
                                defaultValue={setting?.value}
                                onBlur={(e) => {
                                    if (e.target.value !== setting?.value) {
                                        updateSettingMutation.mutate({ key, value: e.target.value });
                                    }
                                }}
                                className="w-full bg-black/40 border border-sc-grey/20 rounded px-4 py-2 text-sm text-white focus:outline-none focus:border-sc-blue/50 transition-all font-mono"
                            />
                        </div>
                    );
                })}
            </div>
            <div className="space-y-6">
                {['smtp_user', 'smtp_pass'].map((key) => {
                    const setting = settings?.find((s: any) => s.key === key);
                    return (
                        <div key={key} className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">{key.replace(/_/g, ' ')}</label>
                            <input 
                                type={key === 'smtp_pass' ? 'password' : 'text'}
                                defaultValue={setting?.value}
                                onBlur={(e) => {
                                    if (e.target.value !== setting?.value) {
                                        updateSettingMutation.mutate({ key, value: e.target.value });
                                    }
                                }}
                                className="w-full bg-black/40 border border-sc-grey/20 rounded px-4 py-2 text-sm text-white focus:outline-none focus:border-sc-blue/50 transition-all font-mono"
                            />
                        </div>
                    );
                })}
                <div className="p-4 bg-sc-blue/5 border border-sc-blue/10 rounded flex items-start space-x-3">
                    <ShieldCheck className="w-4 h-4 text-sc-blue mt-0.5" />
                    <p className="text-[9px] text-sc-grey/60 uppercase leading-relaxed font-bold tracking-widest">
                        Credentials are encrypted at rest. For Gmail, ensure you use an "App Password" rather than your primary login credentials.
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* Data Integrity & Backups */}
      <div className="bg-sc-panel border border-sc-blue/20 p-6 rounded relative overflow-hidden shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.05)]">
        <div className="flex items-center space-x-3 mb-6 border-b border-sc-grey/10 pb-4">
          <Database className="w-5 h-5 text-sc-blue" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">Data Integrity & Backups</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <p className="text-[10px] text-sc-grey/60 uppercase leading-relaxed font-bold tracking-widest">
                    Protect your organization's data. This process bundles the core database and all uploaded assets into a single encrypted archive for off-site storage.
                </p>
                <div className="flex items-center space-x-2 text-[10px] text-yellow-500/60 font-black uppercase tracking-widest">
                    <AlertCircle className="w-4 h-4" />
                    <span>Recommended: Weekly off-site backups</span>
                </div>
            </div>

            <div className="flex justify-center items-center">
                <button 
                    onClick={() => {
                        window.open(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/admin/system/backup`, '_blank');
                    }}
                    className="flex items-center space-x-3 px-8 py-4 bg-sc-blue/10 border border-sc-blue/30 text-sc-blue text-[10px] font-black rounded uppercase hover:bg-sc-blue hover:text-sc-dark transition-all group"
                >
                    <Download className="w-4 h-4 group-hover:bounce" />
                    <span>Generate Cold Storage Backup</span>
                </button>
            </div>
        </div>
      </div>

      {/* RSI Spectrum Orchestration */}
      <div className="bg-sc-panel border border-sc-blue/20 p-6 rounded relative overflow-hidden shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.05)]">
        <div className="flex items-center justify-between mb-6 border-b border-sc-grey/10 pb-4">
          <div className="flex items-center space-x-3">
            <Link2 className="w-5 h-5 text-sc-blue" />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">RSI Spectrum Orchestration</h3>
          </div>
          <button 
            onClick={() => syncRSIMutation.mutate()}
            disabled={syncRSIMutation.isPending || !settings?.find((s: any) => s.key === 'rsi_org_sid')?.value}
            className="flex items-center space-x-2 px-4 py-1.5 bg-sc-blue/10 border border-sc-blue/30 text-sc-blue text-[9px] font-black rounded uppercase hover:bg-sc-blue hover:text-sc-dark transition-all disabled:opacity-20"
          >
            <RefreshCw className={cn("w-3 h-3", syncRSIMutation.isPending && "animate-spin")} />
            <span>{syncRSIMutation.isPending ? 'Syncing Roster...' : 'Sync Personnel Registry'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <p className="text-[10px] text-sc-grey/60 uppercase leading-relaxed font-bold tracking-widest">
                    Automatically synchronize your Hub's personnel registry with your official RSI organization roster. This imports members, ranks, and roles directly from Spectrum.
                </p>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">RSI Organization SID</label>
                    <input 
                        defaultValue={settings?.find((s: any) => s.key === 'rsi_org_sid')?.value}
                        onBlur={(e) => {
                            const current = settings?.find((s: any) => s.key === 'rsi_org_sid')?.value;
                            if (e.target.value !== current) {
                                updateSettingMutation.mutate({ key: 'rsi_org_sid', value: e.target.value });
                            }
                        }}
                        placeholder="e.g. NOVACORP"
                        className="w-full bg-black/40 border border-sc-grey/20 rounded px-4 py-2 text-sm text-white focus:outline-none focus:border-sc-blue/50 transition-all font-mono"
                    />
                </div>
            </div>

            <div className="p-4 bg-sc-blue/5 border border-sc-blue/10 rounded flex flex-col justify-center space-y-3">
                <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-sc-blue" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Identity Verification Active</span>
                </div>
                <p className="text-[9px] text-sc-grey/60 uppercase leading-relaxed font-bold tracking-widest">
                    Members synchronized via Spectrum are automatically flagged for RSI identity matching. Rank permissions will be mapped according to organization hierarchy.
                </p>
            </div>
        </div>
      </div>

      {/* Game Data Intelligence */}
      <div className="bg-sc-panel border border-sc-blue/20 p-6 rounded relative overflow-hidden shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.05)]">
        <div className="flex items-center justify-between mb-6 border-b border-sc-grey/10 pb-4">
          <div className="flex items-center space-x-3">
            <Binary className="w-5 h-5 text-sc-blue" />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Game Data Intelligence</h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-sc-blue rounded-full animate-pulse"></div>
            <span className="text-[8px] text-sc-blue font-black uppercase tracking-widest">Erkul & Unpacked Sync Ready</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <p className="text-[10px] text-sc-grey/60 uppercase leading-relaxed font-bold tracking-widest">
                    Synchronize the Hub's local knowledge bank with high-fidelity community data sources. This updates the catalog of available ships, components, weapons, and manifests.
                </p>
                <div className="p-3 bg-black/40 border border-white/5 rounded flex items-center justify-between">
                    <span className="text-[9px] font-black text-sc-grey/40 uppercase">Primary Source</span>
                    <span className="text-[9px] font-bold text-sc-blue uppercase">scunpacked-v2</span>
                </div>
            </div>

            <div className="flex flex-col justify-center space-y-4">
                <button 
                    onClick={() => syncGameDataMutation.mutate()}
                    disabled={syncGameDataMutation.isPending}
                    className="w-full flex items-center justify-center space-x-3 py-4 bg-sc-blue/10 border border-sc-blue/30 text-sc-blue text-[10px] font-black rounded uppercase hover:bg-sc-blue hover:text-sc-dark transition-all group"
                >
                    <Combine className={cn("w-4 h-4", syncGameDataMutation.isPending && "animate-spin")} />
                    <span>{syncGameDataMutation.isPending ? 'Ingesting Data Packets...' : 'Synchronize Intelligence Bank'}</span>
                </button>
                <p className="text-[8px] text-sc-grey/30 text-center uppercase font-bold tracking-tighter">
                    Note: This process runs in the background and may take several minutes to complete a full ingestion.
                </p>
            </div>
        </div>
      </div>

      {/* System Maintenance Section */}
      <div className="bg-sc-panel border border-sc-blue/20 p-6 rounded relative overflow-hidden shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.05)]">
        <div className="flex items-center space-x-3 mb-6 border-b border-sc-grey/10 pb-4">
          <Cpu className="w-5 h-5 text-sc-blue" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">System Maintenance & Updates</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div className="p-4 bg-black/40 border border-white/5 rounded">
                    <div className="text-[10px] font-black text-sc-grey/40 uppercase tracking-widest mb-1">Current Version</div>
                    <div className="text-xl font-bold text-sc-blue font-mono">{versionInfo?.version || '1.0.0-alpha'}</div>
                </div>
                
                <div className="p-4 bg-black/40 border border-white/5 rounded">
                    <div className="text-[10px] font-black text-sc-grey/40 uppercase tracking-widest mb-1">Update Server</div>
                    <div className="text-sm font-bold text-white uppercase tracking-widest">Official Hub Registry</div>
                    <div className="flex items-center space-x-2 mt-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[9px] text-green-500 font-bold uppercase tracking-widest">Synchronized</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col justify-center items-center p-8 bg-sc-blue/5 border border-sc-blue/20 rounded-lg text-center space-y-4">
                <ArrowUpCircle className={cn(
                    "w-12 h-12 text-sc-blue",
                    updateSystemMutation.isPending && "animate-bounce"
                )} />
                <div className="space-y-2">
                    <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Remote Upgrade Available</h4>
                    <p className="text-[10px] text-sc-grey/60 uppercase leading-relaxed font-bold tracking-widest">
                        Initiate a system-wide pull from the master registry. This will rebuild the backend and frontend modules.
                    </p>
                </div>
                <button 
                    onClick={() => {
                        if(confirm('Are you sure you want to initiate a system update? This will temporarily interrupt service.')) {
                            updateSystemMutation.mutate();
                        }
                    }}
                    disabled={updateSystemMutation.isPending}
                    className="w-full py-3 bg-sc-blue/20 border border-sc-blue/40 text-sc-blue text-[10px] font-black rounded uppercase hover:bg-sc-blue hover:text-sc-dark transition-all disabled:opacity-20"
                >
                    {updateSystemMutation.isPending ? 'Downloading Transmission...' : 'Execute System Upgrade'}
                </button>
            </div>
        </div>
      </div>

      {/* System Logs Section */}
      <div className="bg-sc-panel border border-sc-blue/20 p-6 rounded relative overflow-hidden shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.05)]">
        <div className="flex items-center justify-between mb-6 border-b border-sc-grey/10 pb-4">
          <div className="flex items-center space-x-3">
            <Terminal className="w-5 h-5 text-sc-blue" />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Kernel Output (System Logs)</h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-sc-blue rounded-full animate-pulse"></div>
            <span className="text-[8px] text-sc-blue font-black uppercase tracking-widest">Real-time Monitoring</span>
          </div>
        </div>

        <div className="bg-black/60 border border-sc-grey/20 rounded-lg p-4 h-64 overflow-y-auto custom-scrollbar font-mono text-[10px] leading-relaxed text-sc-blue/80">
            {systemLogs ? (
                <pre className="whitespace-pre-wrap">{systemLogs}</pre>
            ) : (
                <div className="h-full flex items-center justify-center text-sc-grey/20 uppercase tracking-[0.3em] font-black italic">
                    Initializing Signal Tap...
                </div>
            )}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-[9px] font-bold text-sc-grey/40 uppercase tracking-widest">
            <span>Accessing: logs/backend.log</span>
            <span>Tail: Last 10KB</span>
        </div>
      </div>
    </section>
  );
}
