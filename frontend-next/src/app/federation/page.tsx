'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Globe, 
  ChevronRight, 
  Plus,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FederationPage() {
  const { data: peers, isLoading } = useQuery({
    queryKey: ['federation-peers'],
    queryFn: async () => {
      const res = await api.get('/federation/peers');
      return res.data;
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Inter-Org Federation
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Encrypted Instance Peering & Intelligence Sharing
          </p>
        </div>
        <button className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Establish Link
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full p-24 text-center">
            <Globe className="w-12 h-12 text-sc-blue opacity-20 animate-spin mx-auto mb-4" />
            <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic font-mono">Synchronizing cross-instance protocols...</span>
          </div>
        ) : peers?.length > 0 ? (
          peers.map((peer: any) => (
            <div 
              key={peer.id} 
              className="bg-sc-panel border border-sc-grey/10 rounded-lg p-6 group hover:border-sc-blue/30 transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "px-2 py-0.5 border rounded text-[8px] font-black uppercase tracking-widest",
                      peer.status === 'active' ? "bg-green-500/5 border-green-500/20 text-green-400" : "bg-red-500/5 border-red-500/20 text-red-400"
                    )}>
                      {peer.status}
                    </span>
                    <span className="text-[10px] text-sc-grey/30 font-mono">ID: {peer.id.toString().padStart(3, '0')}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">{peer.name}</h3>
                </div>
                <Globe className="w-8 h-8 text-sc-grey/10 group-hover:text-sc-blue/20 transition-colors" />
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest block">Instance URL</span>
                  <span className="text-xs text-sc-blue font-mono truncate block">{peer.url}</span>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-sc-grey/5 text-[9px] font-bold uppercase text-sc-grey/40">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-green-500/50" />
                      HMAC-SHA256
                    </span>
                    <span className="flex items-center">
                      <Zap className="w-3.5 h-3.5 mr-1.5 text-yellow-500/50" />
                      Live Feed
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-sc-grey/20 group-hover:text-sc-blue group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-sc-panel border border-sc-grey/10 p-24 text-center rounded relative">
            <Globe className="w-16 h-16 text-sc-grey/10 mx-auto mb-4" />
            <p className="text-sc-grey/30 uppercase tracking-[0.3em] text-sm italic">Standalone mode active. No allied instances linked.</p>
          </div>
        )}
      </div>

      <div className="bg-sc-panel border border-sc-grey/10 rounded p-8">
        <h3 className="text-xs font-black text-sc-blue uppercase tracking-[0.3em] mb-6 border-b border-sc-blue/20 pb-2 flex items-center">
          <Activity className="w-4 h-4 mr-2" />
          Cross-Instance Intelligence
        </h3>
        <div className="space-y-4">
          <div className="p-12 text-center border border-dashed border-sc-grey/10 rounded">
            <span className="text-[10px] text-sc-grey/20 uppercase font-black tracking-[0.2em]">No external data signals detected.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
