'use client';

import React from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Database, GitBranch, Rss } from 'lucide-react';

export default function AdminDataManagementPage() {
  const syncGameDataMutation = useMutation({
    mutationFn: () => api.post('/admin/system/sync-game-data'),
    onSuccess: (data) => {
      alert(`Game Data Sync Initiated: ${data.data.status}`);
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    },
  });

  const syncRsiDataMutation = useMutation({
    mutationFn: () => api.post('/admin/system/sync-rsi'),
    onSuccess: (data) => {
      alert(`RSI Data Sync Initiated: ${data.data.status}`);
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    },
  });

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
          Data Management
        </h2>
        <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
          System Data Synchronization & Maintenance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-sc-panel border border-white/5 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <GitBranch className="w-5 h-5 text-sc-blue" />
            <h3 className="text-lg font-bold text-white tracking-wider uppercase">Game Data Synchronization</h3>
          </div>
          <p className="text-sm text-sc-grey/60">
            Clones or pulls the latest `scunpacked-data` repository and synchronizes all ship and item data with the local database. This can take several minutes.
          </p>
          <button
            onClick={() => syncGameDataMutation.mutate()}
            disabled={syncGameDataMutation.isPending}
            className="w-full px-6 py-3 bg-sc-blue/10 border border-sc-blue/30 text-sc-blue text-xs font-black rounded uppercase hover:bg-sc-blue hover:text-sc-dark transition-all shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.1)] flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            <span>{syncGameDataMutation.isPending ? 'Sync in Progress...' : 'Initiate Game Data Sync'}</span>
          </button>
        </div>

        <div className="bg-sc-panel border border-white/5 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Rss className="w-5 h-5 text-sc-blue" />
            <h3 className="text-lg font-bold text-white tracking-wider uppercase">RSI Roster Synchronization</h3>
          </div>
          <p className="text-sm text-sc-grey/60">
            Fetches the latest member list from the configured RSI Organization page. This process will add new members and mark members no longer in the roster as unverified.
          </p>
          <button
            onClick={() => syncRsiDataMutation.mutate()}
            disabled={syncRsiDataMutation.isPending}
            className="w-full px-6 py-3 bg-sc-blue/10 border border-sc-blue/30 text-sc-blue text-xs font-black rounded uppercase hover:bg-sc-blue hover:text-sc-dark transition-all shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.1)] flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Rss className="w-4 h-4" />
            <span>{syncRsiDataMutation.isPending ? 'Sync in Progress...' : 'Initiate RSI Roster Sync'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
