'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Rocket, 
  Plus, 
  Dna, 
  Layers, 
  Shield, 
  Zap, 
  Crosshair,
  FileText,
  Search,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function LoadoutDashboardPage() {
  const { data: loadouts, isLoading } = useQuery({
    queryKey: ['ship-loadouts'],
    queryFn: async () => {
      const res = await api.get('/game-data/loadouts');
      return res.data;
    },
  });

  const { data: shipModels } = useQuery({
    queryKey: ['ship-models'],
    queryFn: async () => {
      const res = await api.get('/game-data/ships');
      return res.data;
    },
  });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Blueprint Data-Bank</h2>
          <p className="text-[10px] text-sc-blue font-mono uppercase tracking-[0.2em]">High-Fidelity Loadout Management • Operational Ready</p>
        </div>
        <Link 
          href="/fleet/loadouts/new"
          className="flex items-center space-x-3 px-6 py-3 bg-sc-blue/10 border border-sc-blue/30 text-sc-blue text-[10px] font-black rounded uppercase hover:bg-sc-blue hover:text-sc-dark transition-all group"
        >
          <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Forge New Loadout</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Standard Issue Templates */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-sc-panel border border-sc-blue/20 p-6 rounded relative overflow-hidden shadow-xl">
                <div className="flex items-center space-x-3 mb-6 border-b border-sc-grey/10 pb-4">
                    <Shield className="w-5 h-5 text-sc-blue" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Standard Issue Templates</h3>
                </div>
                
                <div className="space-y-4">
                    <p className="text-[10px] text-sc-grey/60 uppercase leading-relaxed font-bold tracking-widest mb-4">
                        Organization-approved configurations for specific mission profiles.
                    </p>
                    
                    <div className="space-y-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="p-4 bg-black/40 border border-white/5 rounded hover:border-sc-blue/30 transition-all cursor-pointer group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">F7C MkII - Combat Ace</span>
                                    <Dna className="w-3 h-3 text-sc-blue opacity-40" />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="px-2 py-0.5 bg-sc-blue/10 rounded text-[8px] font-bold text-sc-blue uppercase">Tier 1</div>
                                    <div className="text-[8px] text-sc-grey/40 uppercase font-mono italic">Revised: 2954.02.14</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-sc-panel border border-sc-blue/20 p-6 rounded relative overflow-hidden shadow-xl">
                <div className="flex items-center space-x-3 mb-6 border-b border-sc-grey/10 pb-4">
                    <Layers className="w-5 h-5 text-sc-blue" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Global Ship Registry</h3>
                </div>
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sc-grey/40" />
                    <input 
                        placeholder="Search models..."
                        className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded pl-9 pr-4 py-2 text-[10px] text-white focus:outline-none focus:border-sc-blue/50 uppercase tracking-widest font-bold"
                    />
                </div>
                <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                    {shipModels?.map((ship: any) => (
                        <div key={ship.id} className="flex items-center justify-between p-2 rounded hover:bg-white/5 group cursor-pointer transition-all">
                            <span className="text-[10px] font-bold text-sc-grey/60 group-hover:text-white uppercase truncate pr-4">{ship.name}</span>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="w-3 h-3 text-sc-blue" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Col: Personal & Active Loadouts */}
        <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {!loadouts || loadouts.length === 0 ? (
                    <div className="md:col-span-2 p-20 bg-sc-panel border border-dashed border-sc-grey/20 rounded-lg flex flex-col items-center justify-center space-y-4 opacity-40 text-center">
                        <div className="h-16 w-16 rounded-full bg-sc-dark border border-sc-grey/10 flex items-center justify-center text-sc-blue/40 animate-pulse">
                            <Rocket className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">No Active Blueprints</h4>
                            <p className="text-[10px] text-sc-grey/60 uppercase font-bold tracking-widest">Select a ship model to begin fabrication.</p>
                        </div>
                    </div>
                ) : (
                    loadouts.map((loadout: any) => (
                        <LoadoutCard key={loadout.id} loadout={loadout} />
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

const LoadoutCard = ({ loadout }: { loadout: any }) => (
    <div className="bg-sc-panel border border-sc-blue/10 rounded-lg overflow-hidden group hover:border-sc-blue/40 transition-all shadow-xl">
        <div className="p-4 bg-black/40 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center space-x-3">
                <Rocket className="w-4 h-4 text-sc-blue" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{loadout.ship_model?.name}</span>
            </div>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
        </div>
        <div className="p-6 space-y-6">
            <div className="space-y-1">
                <h4 className="text-sm font-bold text-white uppercase italic">{loadout.template_name || 'Custom Configuration'}</h4>
                <p className="text-[9px] text-sc-grey/40 uppercase font-mono">Last Calibrated: {new Date(loadout.updated_at).toLocaleDateString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <StatItem icon={<Crosshair className="w-3 h-3" />} label="Burst DPS" value="4,210" />
                <StatItem icon={<Shield className="w-3 h-3" />} label="Shield HP" value="12,500" />
                <StatItem icon={<Zap className="w-3 h-3" />} label="Power Excess" value="12%" />
                <StatItem icon={<FileText className="w-3 h-3" />} label="Components" value="14 Total" />
            </div>

            <Link 
                href={`/fleet/loadouts/${loadout.id}`}
                className="w-full py-2 bg-sc-dark border border-sc-grey/10 text-[9px] font-black text-sc-grey/60 uppercase tracking-widest rounded flex items-center justify-center space-x-2 group-hover:bg-sc-blue group-hover:text-sc-dark group-hover:border-sc-blue transition-all"
            >
                <span>Access Blueprint</span>
                <ExternalLink className="w-3 h-3" />
            </Link>
        </div>
    </div>
);

const StatItem = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="space-y-1">
        <div className="flex items-center space-x-2 text-sc-grey/40">
            {icon}
            <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
        </div>
        <div className="text-xs font-bold text-white uppercase tracking-tighter">{value}</div>
    </div>
);
