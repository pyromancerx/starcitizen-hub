'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Plus, 
  Package, 
  Shield, 
  Target, 
  ChevronRight,
  Search,
  ExternalLink,
  Wrench,
  Dna
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ManifestDashboardPage() {
  const { data: manifests, isLoading } = useQuery({
    queryKey: ['equipment-manifests'],
    queryFn: async () => {
      const res = await api.get('/game-data/manifests'); // Need to implement this backend route
      return res.data;
    },
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Logistics Manifests</h2>
          <p className="text-[10px] text-sc-blue font-mono uppercase tracking-[0.2em]">Ground Gear & Equipment Kits • Operational Ready</p>
        </div>
        <Link 
          href="/fleet/manifests/new"
          className="flex items-center space-x-3 px-6 py-3 bg-sc-blue/10 border border-sc-blue/30 text-sc-blue text-[10px] font-black rounded uppercase hover:bg-sc-blue hover:text-sc-dark transition-all group"
        >
          <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Provision New Kit</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Standard Issue Kits */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-sc-panel border border-sc-blue/20 p-6 rounded relative overflow-hidden shadow-xl">
                <div className="flex items-center space-x-3 mb-6 border-b border-sc-grey/10 pb-4">
                    <Shield className="w-5 h-5 text-sc-blue" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Standard Issue Kits</h3>
                </div>
                
                <div className="space-y-4">
                    <p className="text-[10px] text-sc-grey/60 uppercase leading-relaxed font-bold tracking-widest mb-4">
                        Standardized ground equipment for specialized roles.
                    </p>
                    
                    <div className="space-y-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="p-4 bg-black/40 border border-white/5 rounded hover:border-sc-blue/30 transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                        {i === 1 ? 'Heavy Infiltration' : 'Combat Medical'}
                                    </span>
                                    <Package className="w-3 h-3 text-sc-blue opacity-40" />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="px-2 py-0.5 bg-sc-blue/10 rounded text-[8px] font-bold text-sc-blue uppercase">Tier 1</div>
                                    <div className="text-[8px] text-sc-grey/40 uppercase font-mono italic">8 Items Specified</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Right Col: All Manifests */}
        <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!manifests || manifests.length === 0 ? (
                    <div className="md:col-span-2 p-20 bg-sc-panel border border-dashed border-sc-grey/20 rounded-lg flex flex-col items-center justify-center space-y-4 opacity-40 text-center">
                        <div className="h-16 w-16 rounded-full bg-sc-dark border border-sc-grey/10 flex items-center justify-center text-sc-blue/40 animate-pulse">
                            <Package className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">No Active Manifests</h4>
                            <p className="text-[10px] text-sc-grey/60 uppercase font-bold tracking-widest">Build an equipment manifest to start readiness checks.</p>
                        </div>
                    </div>
                ) : (
                    manifests.map((manifest: any) => (
                        <div key={manifest.id} className="bg-sc-panel border border-sc-blue/10 rounded-lg overflow-hidden group hover:border-sc-blue/40 transition-all shadow-xl">
                            <div className="p-4 bg-black/40 border-b border-white/5 flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <Package className="w-4 h-4 text-sc-blue" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{manifest.name}</span>
                                </div>
                                <span className="text-[8px] text-sc-grey/40 uppercase font-mono italic">Manifest Active</span>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-white uppercase italic">{manifest.description || 'Personal Equipment Set'}</h4>
                                    <p className="text-[9px] text-sc-grey/40 uppercase font-mono">Last Calibrated: {new Date(manifest.updated_at).toLocaleDateString()}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <div className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Total Weight</div>
                                        <div className="text-xs font-bold text-white">42.5 KG</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Item Count</div>
                                        <div className="text-xs font-bold text-white">12 Items</div>
                                    </div>
                                </div>

                                <Link 
                                    href={`/fleet/manifests/${manifest.id}`}
                                    className="w-full py-2 bg-sc-dark border border-sc-grey/10 text-[9px] font-black text-sc-grey/60 uppercase tracking-widest rounded flex items-center justify-center space-x-2 group-hover:bg-sc-blue group-hover:text-sc-dark group-hover:border-sc-blue transition-all"
                                >
                                    <span>Review Manifest</span>
                                    <ExternalLink className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
