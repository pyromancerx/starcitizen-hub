'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  MessageSquare, 
  Save, 
  RefreshCw, 
  Check, 
  Bot, 
  Webhook, 
  Shield, 
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDiscordPage() {
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['admin-discord'],
    queryFn: async () => {
      try {
        const res = await api.get('/discord/config');
        return res.data;
      } catch (e) {
        // Return empty defaults if not found
        return {
          guild_id: '',
          bot_token: '',
          webhook_url: '',
          role_sync_enabled: false,
          is_active: true
        };
      }
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: any) => {
      return api.patch('/discord/config', newConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-discord'] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Convert checkbox to boolean
    const payload = {
      ...data,
      role_sync_enabled: formData.get('role_sync_enabled') === 'on',
      is_active: formData.get('is_active') === 'on',
    };

    updateConfigMutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div className="bg-sc-panel border border-sc-grey/10 rounded p-8 relative overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between mb-8 border-b border-sc-grey/10 pb-4">
          <div className="flex items-center space-x-3">
            <Bot className="w-5 h-5 text-sc-blue" />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Discord Relay Configuration</h3>
          </div>
          {success && (
            <div className="flex items-center text-green-400 text-[10px] font-black uppercase tracking-widest animate-in fade-in zoom-in">
              <Check className="w-3 h-3 mr-1" /> Uplink Synchronized
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sc-grey/40 uppercase tracking-widest text-[10px] font-mono animate-pulse">
            Establishing secure relay tunnel...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-sc-blue uppercase tracking-widest">Server ID (Guild ID)</label>
                  <input 
                    name="guild_id"
                    defaultValue={config?.guild_id}
                    className="w-full bg-sc-dark border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all font-mono"
                    placeholder="8472930..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-sc-blue uppercase tracking-widest">Bot Access Token</label>
                  <input 
                    name="bot_token"
                    type="password"
                    defaultValue={config?.bot_token}
                    className="w-full bg-sc-dark border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all font-mono"
                    placeholder="MTAy..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-sc-blue uppercase tracking-widest">Global Webhook URL</label>
                  <input 
                    name="webhook_url"
                    defaultValue={config?.webhook_url}
                    className="w-full bg-sc-dark border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all font-mono"
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                </div>
                <div className="flex flex-col space-y-4 pt-2">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      name="role_sync_enabled"
                      defaultChecked={config?.role_sync_enabled}
                      className="w-4 h-4 bg-sc-dark border-sc-grey/20 text-sc-blue rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[10px] font-black text-sc-grey/60 uppercase tracking-widest group-hover:text-white transition-colors">Enable Role Synchronization</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      name="is_active"
                      defaultChecked={config?.is_active}
                      className="w-4 h-4 bg-sc-dark border-sc-grey/20 text-sc-blue rounded focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[10px] font-black text-sc-grey/60 uppercase tracking-widest group-hover:text-white transition-colors">Relay Link Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-sc-grey/10 flex justify-between items-center">
              <div className="flex items-start space-x-3 opacity-40 max-w-lg">
                <Shield className="w-4 h-4 text-sc-blue mt-0.5" />
                <p className="text-[9px] text-sc-grey uppercase tracking-widest font-bold leading-relaxed">
                  Discord relay allows for automated broadcast of organization events, achievements, and fleet updates directly to your specified server channels.
                </p>
              </div>
              <button 
                type="submit"
                disabled={updateConfigMutation.isPending}
                className="px-8 py-3 bg-sc-blue text-sc-dark text-xs font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.3)] flex items-center disabled:opacity-50"
              >
                {updateConfigMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Sync Relay
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="p-6 border border-yellow-500/20 bg-yellow-500/5 rounded-lg flex items-start space-x-4">
        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
        <div className="space-y-1">
          <h4 className="text-xs font-black text-white uppercase tracking-widest">Bot Permissions Notice</h4>
          <p className="text-[10px] text-sc-grey/60 leading-relaxed uppercase font-bold tracking-widest">
            Ensure your Discord bot has the following permissions: "Manage Roles", "Send Messages", and "Embed Links" in the target server for full functionality.
          </p>
        </div>
      </div>
    </div>
  );
}
