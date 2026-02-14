'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Rocket, 
  ChevronLeft, 
  Shield, 
  Zap, 
  Crosshair, 
  Wrench, 
  Cpu, 
  Save, 
  RotateCcw,
  Search,
  Box,
  ArrowRight,
  MapPin,
  ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function LoadoutBuilderPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [selectedHardpoint, setSelectedHardpoint] = useState<string | null>(null);
  const [searchTerm, setSearchQuery] = useState('');
  const [configuration, setConfiguration] = useState<Record<string, any>>({});

  // 1. Fetch Ship Model & Current Loadout
  const { data: loadout, isLoading } = useQuery({
    queryKey: ['loadout', id],
    queryFn: async () => {
      if (id === 'new') {
        const res = await api.get(`/game-data/ships/1`); // Mocking model ID 1
        return { ship_model: res.data, configuration: "{}" };
      }
      const res = await api.get(`/game-data/loadouts/${id}`);
      return res.data;
    },
  });

  // 2. Fetch compatible items for selected hardpoint
  const { data: items } = useQuery({
    queryKey: ['game-items', selectedHardpoint, searchTerm],
    queryFn: async () => {
      const category = selectedHardpoint?.toLowerCase().includes('weapon') ? 'Weapon' : 'Shield';
      const res = await api.get(`/game-data/items?q=${searchTerm}&category=${category}`);
      return res.data;
    },
    enabled: !!selectedHardpoint,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ship_model_id: loadout.ship_model.id,
        configuration: JSON.stringify(configuration),
        template_name: 'Custom Configuration'
      };
      if (id === 'new') return api.post('/game-data/loadouts', payload);
      return api.patch(`/game-data/loadouts/${id}`, payload);
    },
    onSuccess: () => {
      alert('Blueprint saved to organization database.');
      queryClient.invalidateQueries({ queryKey: ['ship-loadouts'] });
    }
  });

  const handleSelectItem = (item: any) => {
    if (selectedHardpoint) {
      setConfiguration(prev => ({
        ...prev,
        [selectedHardpoint]: item
      }));
    }
  };

  if (isLoading) return <div className="p-20 text-center uppercase font-black text-sc-blue animate-pulse tracking-[0.5em]">Synchronizing Blueprint...</div>;

  // 3. Parse and Group Dynamic Hardpoints
  const rawHardpoints = JSON.parse(loadout?.ship_model?.hardpoints || '{}');
  
  const groupedHardpoints = {
    weapons: [] as any[],
    systems: [] as any[],
    utility: [] as any[]
  };

  // Logic to process scunpacked hardpoint structure
  if (typeof rawHardpoints === 'object') {
    Object.entries(rawHardpoints).forEach(([key, hp]: [string, any]) => {
        // Filter for user-interactable slots
        const type = hp.type || '';
        const name = hp.name || hp.label || key;
        
        if (type.includes('Weapon') || type.includes('Missile') || type.includes('Turret')) {
            groupedHardpoints.weapons.push({ id: key, name, type, size: hp.size });
        } else if (type.includes('Shield') || type.includes('Power') || type.includes('Cooler') || type.includes('Quantum')) {
            groupedHardpoints.systems.push({ id: key, name, type, size: hp.size });
        } else if (hp.size > 0) {
            groupedHardpoints.utility.push({ id: key, name, type, size: hp.size });
        }
    });
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      {/* Top Navigation / Controls */}
      <div className="flex justify-between items-center bg-black/40 border border-white/5 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
            <Link href="/fleet/loadouts" className="p-2 hover:bg-white/5 rounded text-sc-grey/40 hover:text-white transition-all">
                <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest">{loadout?.ship_model?.name} • Configuration Alpha</h2>
                <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sc-blue animate-pulse"></div>
                    <span className="text-[8px] text-sc-blue font-black uppercase tracking-widest italic">Blueprint Unlocked for Calibration</span>
                </div>
            </div>
        </div>
        <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-white/5 border border-white/10 text-sc-grey/40 text-[10px] font-black rounded uppercase hover:text-white transition-all flex items-center space-x-2">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Matrix</span>
            </button>
            <button 
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="px-6 py-2 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all flex items-center space-x-2 disabled:opacity-20"
            >
                <Save className="w-3.5 h-3.5" />
                <span>{saveMutation.isPending ? 'Saving...' : 'Save Blueprint'}</span>
            </button>
        </div>
      </div>

      <div className="flex-1 flex space-x-6 min-h-0">
        {/* Left: Loadout Matrix (Hardpoints) */}
        <div className="flex-1 bg-sc-panel border border-white/5 rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-black/20 border-b border-white/5 flex items-center space-x-3">
                <Wrench className="w-4 h-4 text-sc-blue" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Tactical Loadout Matrix</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                {/* Dynamic Categories */}
                {groupedHardpoints.weapons.length > 0 && (
                    <HardpointGroup 
                        title="Weaponry & Ordnance" 
                        icon={<Crosshair className="w-4 h-4" />}
                        items={groupedHardpoints.weapons}
                        selected={selectedHardpoint}
                        onSelect={setSelectedHardpoint}
                        configuration={configuration}
                    />
                )}
                {groupedHardpoints.systems.length > 0 && (
                    <HardpointGroup 
                        title="Shielding & Core Systems" 
                        icon={<Shield className="w-4 h-4" />}
                        items={groupedHardpoints.systems}
                        selected={selectedHardpoint}
                        onSelect={setSelectedHardpoint}
                        configuration={configuration}
                    />
                )}
                {groupedHardpoints.utility.length > 0 && (
                    <HardpointGroup 
                        title="Auxiliary & Propulsion" 
                        icon={<Zap className="w-4 h-4" />}
                        items={groupedHardpoints.utility}
                        selected={selectedHardpoint}
                        onSelect={setSelectedHardpoint}
                        configuration={configuration}
                    />
                )}

                {Object.values(groupedHardpoints).flat().length === 0 && (
                    <div className="p-12 text-center text-sc-grey/20 uppercase font-black italic tracking-widest">
                        No compatible hardpoints detected for this model.
                    </div>
                )}
            </div>
        </div>

        {/* Right: Component Browser & Analytics */}
        <div className="w-96 flex flex-col space-y-6">
            {/* Component Browser (Contextual) */}
            <div className="flex-1 bg-sc-panel border border-sc-blue/20 rounded-lg flex flex-col overflow-hidden shadow-2xl relative">
                <div className="p-4 border-b border-white/5 bg-black/20">
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Neural Link: Registry</span>
                </div>
                
                {!selectedHardpoint ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-20">
                        <Box className="w-12 h-12 mb-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-relaxed">Select a hardpoint to access compatible component database</span>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="p-4 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sc-grey/40" />
                                <input 
                                    placeholder="Search registry..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded pl-9 pr-4 py-2 text-[10px] text-white focus:outline-none focus:border-sc-blue/50 uppercase tracking-widest font-bold"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {items?.map((item: any) => (
                                <button 
                                    key={item.id} 
                                    onClick={() => handleSelectItem(item)}
                                    className="w-full text-left p-3 rounded hover:bg-sc-blue/5 border border-transparent hover:border-sc-blue/20 group transition-all flex justify-between items-center"
                                >
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-white uppercase group-hover:text-sc-blue">{item.name}</div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-[8px] text-sc-grey/40 font-mono uppercase">Size {item.size} • {item.manufacturer}</span>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-3 h-3 text-sc-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Location HUD */}
            {selectedHardpoint && configuration[selectedHardpoint] && (
                <div className="bg-sc-panel border border-sc-blue/10 p-6 rounded-lg shadow-xl space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center space-x-3 border-b border-sc-grey/10 pb-4">
                        <MapPin className="w-4 h-4 text-sc-blue" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Planetary Procurement HUD</span>
                    </div>
                    <div className="space-y-3">
                        <div className="text-[10px] text-sc-grey/60 uppercase font-bold tracking-widest leading-relaxed">
                            Authorized vendors for <span className="text-sc-blue">{configuration[selectedHardpoint].name}</span>:
                        </div>
                        <div className="space-y-1">
                            {JSON.parse(configuration[selectedHardpoint].locations || '[]').map((loc: string, i: number) => (
                                <div key={i} className="flex items-center space-x-2 p-2 bg-black/40 border border-white/5 rounded">
                                    <ShoppingCart className="w-3 h-3 text-sc-blue/40" />
                                    <span className="text-[9px] font-bold text-white uppercase truncate">{loc}</span>
                                </div>
                            ))}
                            {JSON.parse(configuration[selectedHardpoint].locations || '[]').length === 0 && (
                                <div className="text-[9px] text-sc-grey/40 uppercase italic p-2 bg-black/20 rounded">
                                    No localized shop signals detected for this item.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Live Stats */}
            <div className="bg-sc-panel border border-sc-blue/10 p-6 rounded-lg shadow-xl space-y-6">
                <div className="flex items-center space-x-3 border-b border-sc-grey/10 pb-4">
                    <Cpu className="w-4 h-4 text-sc-blue" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Performance Analytics</span>
                </div>
                
                <div className="space-y-4">
                    <StatBar label="Burst Damage (DPS)" value="4,210" percent={75} />
                    <StatBar label="Shield Endurance" value="12,500 HP" percent={60} />
                    <StatBar label="Power Stability" value="112%" percent={90} color="bg-sc-blue" />
                    <StatBar label="Heat Management" value="Stable" percent={45} color="bg-yellow-500" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

const HardpointGroup = ({ title, icon, items, selected, onSelect, configuration }: { title: string, icon: any, items: any[], selected: string | null, onSelect: (s: string) => void, configuration: any }) => (
    <div className="space-y-4">
        <div className="flex items-center space-x-3 text-sc-grey/40">
            {icon}
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em]">{title}</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((hp) => {
                const equipped = configuration[hp.id];
                return (
                    <button 
                        key={hp.id}
                        onClick={() => onSelect(hp.id)}
                        className={cn(
                            "p-4 rounded border transition-all text-left group relative overflow-hidden",
                            selected === hp.id 
                                ? "bg-sc-blue/10 border-sc-blue shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.1)]" 
                                : "bg-sc-dark border-white/5 hover:border-white/20 hover:bg-white/5"
                        )}
                    >
                        {selected === hp.id && (
                            <div className="absolute top-0 right-0 p-1">
                                <div className="w-1.5 h-1.5 bg-sc-blue rounded-full shadow-[0_0_5px_rgba(var(--color-sc-blue-rgb),0.8)]"></div>
                            </div>
                        )}
                        <div className="text-[10px] font-bold text-white uppercase tracking-widest group-hover:text-sc-blue transition-colors truncate">{hp.name}</div>
                        <div className="mt-1 flex items-center justify-between">
                            <span className={cn(
                                "text-[8px] uppercase font-mono italic truncate max-w-[120px]",
                                equipped ? "text-sc-blue font-bold" : "text-sc-grey/40"
                            )}>
                                {equipped ? equipped.name : hp.type || 'Standard Slot'}
                            </span>
                            <span className="text-[8px] text-sc-grey/20 font-black uppercase">Size {hp.size}</span>
                        </div>
                    </button>
                );
            })}
        </div>
    </div>
);

const StatBar = ({ label, value, percent, color = "bg-sc-blue" }: { label: string, value: string, percent: number, color?: string }) => (
    <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
            <span className="text-sc-grey/40">{label}</span>
            <span className="text-white">{value}</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
                className={cn("h-full transition-all duration-1000", color)} 
                style={{ width: `${percent}%` }}
            />
        </div>
    </div>
);
