'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Building2, 
  ChevronRight, 
  TrendingUp,
  History,
  ShieldCheck,
  Plus,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TreasuryPage() {
  const { data: treasury, isLoading } = useQuery({
    queryKey: ['org-treasury'],
    queryFn: async () => {
      const res = await api.get('/treasury/');
      return res.data;
    },
  });

  const { data: analytics } = useQuery({
    queryKey: ['treasury-analytics'],
    queryFn: async () => {
      const res = await api.get('/treasury/analytics');
      return res.data;
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Organization Treasury
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Command-Level Financial Management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => alert('Fiscal authorization required: Treasury budget allocation is locked to Command Council members.')}
            className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Budget Allocation
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-sc-panel to-sc-dark border border-sc-blue/30 rounded-lg p-10 relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Building2 className="w-48 h-48 text-sc-blue" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="text-[10px] text-sc-blue font-black uppercase tracking-[0.4em] flex items-center justify-center md:justify-start">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Consolidated Assets
            </div>
            <div className="text-7xl font-mono font-bold text-white tracking-tighter shadow-sc-blue/20">
              {isLoading ? 'XXXXXXXX' : (treasury?.balance || 0).toLocaleString()}
              <span className="text-xl ml-2 text-sc-grey/40 uppercase font-black tracking-widest">aUEC</span>
            </div>
            <div className="flex justify-center md:justify-start space-x-6 text-[10px] text-sc-grey/40 uppercase font-black tracking-widest">
              <span>Status: <span className="text-green-500">Secure</span></span>
              <span>Reserve Index: 1.42</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/40 border border-sc-grey/10 rounded p-6">
              <div className="text-[8px] text-sc-grey/40 font-black uppercase tracking-widest mb-2">Total Trade Profit</div>
              <div className="text-xl font-bold text-green-400 font-mono">+{analytics?.total_trade_profit?.toLocaleString() || '0'}</div>
            </div>
            <div className="bg-black/40 border border-sc-grey/10 rounded p-6">
              <div className="text-[8px] text-sc-grey/40 font-black uppercase tracking-widest mb-2">Active Contracts</div>
              <div className="text-xl font-bold text-sc-blue font-mono">{analytics?.active_contracts || '0'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-sc-blue" />
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Ledger Activity</h3>
        </div>

        <div className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden">
          <div className="p-12 text-center text-sc-grey/30 uppercase tracking-[0.3em] text-sm italic">
            Accessing decentralized encrypted logs...
          </div>
        </div>
      </div>
    </div>
  );
}
