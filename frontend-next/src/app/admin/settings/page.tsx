'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Settings, 
  Save,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await api.get('/admin/settings');
      return res.data;
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: string }) => {
      return api.patch('/admin/settings', { key, value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
  });

  return (
    <section className="max-w-4xl space-y-6">
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
    </section>
  );
}
