'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
  ShoppingCart,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function LoadoutBuilderClient() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const modelId = searchParams.get('modelId');
  const queryClient = useQueryClient();
  const [selectedHardpoint, setSelectedHardpoint] = useState<string | null>(null);
  const [searchTerm, setSearchQuery] = useState('');
  const [configuration, setConfiguration] = useState<Record<string, any>>({});
  const [showApplyModal, setShowApplyModal] = useState(false);

  // 1. Fetch Ship Model & Current Loadout
  const { data: loadout, isLoading } = useQuery({
    queryKey: ['loadout', id, modelId],
    queryFn: async () => {
      if (id === 'new') {
        const res = await api.get(`/game-data/ships/${modelId || 1}`); 
        return { 
          ship_model: res.data, 
          configuration: res.data.default_loadout || "{}" 
        };
      }
      const res = await api.get(`/game-data/loadouts/${id}`);
      return res.data;
    },
  });

  // Prepopulate configuration when loading
  useEffect(() => {
    if (loadout?.configuration && Object.keys(configuration).length === 0) {
        try {
            const config = typeof loadout.configuration === 'string' 
                ? JSON.parse(loadout.configuration) 
                : loadout.configuration;
            
            // If it's a map of hpName -> itemUUID (like our default_loadout), 
            // we need to fetch or handle item objects.
            // For now, let's just parse what we have.
            setConfiguration(config);
        } catch(e) { console.error("Failed to parse stored config", e); }
    }
  }, [loadout, configuration]);

  // Fetch item objects for the configuration if they are just UUIDs
  const { data: fullConfigItems } = useQuery({
    queryKey: ['config-items', loadout?.configuration],
    queryFn: async () => {
        const config = typeof loadout.configuration === 'string' 
            ? JSON.parse(loadout.configuration) 
            : loadout.configuration;
        
        const itemMap: Record<string, any> = {};
        const uuids = Object.values(config).filter(v => typeof v === 'string') as string[];
        
        if (uuids.length === 0) return null;

        // Batch fetch would be better, but for now we'll rely on cache or specific searches
        // Let's at least try to resolve them
        return config; 
    },
    enabled: !!loadout?.configuration
  });

  const { data: myShips } = useQuery({
    queryKey: ['my-ships'],
    queryFn: async () => {
      const res = await api.get('/ships/');
      return res.data;
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (shipId: number) => {
      return api.post('/game-data/loadouts/apply', {
        loadout_id: Number(id),
        ship_id: shipId
      });
    },
    onSuccess: () => {
      setShowApplyModal(false);
      alert('Blueprint successfully synchronized with vessel systems.');
    },
  });

  // 2. Fetch compatible items for selected hardpoint
  const activeHp = normalizedHardpoints.find(hp => hp.id === selectedHardpoint);

  const { data: items } = useQuery({
    queryKey: ['game-items', selectedHardpoint, searchTerm, activeHp?.size],
    queryFn: async () => {
      const type = activeHp?.type || '';
      const size = activeHp?.size || 0;
      const res = await api.get(`/game-data/items?q=${searchTerm}&category=${type}&size=${size}`);
      return res.data;
    },
    enabled: !!selectedHardpoint,
  });

  // 3. Calculate Live Stats
  const calculatedStats = React.useMemo(() => {
    let dps = 0;
    let shields = 0;
    let power = 0;

    Object.values(configuration).forEach((item: any) => {
        const stats = JSON.parse(item.stats || '{}');
        if (stats.dps) dps += stats.dps;
        if (stats.shield_hp) shields += stats.shield_hp;
        if (stats.power_draw) power += stats.power_draw;
    });

    return { dps, shields, power };
  }, [configuration]);

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

  // 3. Robust Hardpoint Normalization & Grouping (Recursive)
  const normalizedHardpoints = (() => {
    const results: any[] = [];

    const recurse = (hps: any, parentName?: string) => {
        if (Array.isArray(hps)) {
            hps.forEach((hp, idx) => {
                const id = hp.HardpointName || hp.name || (parentName ? `${parentName}_${idx}` : `hp_${idx}`);
                const name = hp.name || hp.HardpointName || hp.category || 'Hardpoint';
                const type = hp.type || (hp.ItemTypes?.[0]?.Type) || 'Unknown';
                const size = hp.size || hp.MaxSize || 0;

                results.push({
                    id,
                    name: parentName ? `${parentName} > ${name}` : name,
                    type,
                    size,
                    defaultItem: hp.databaseItem
                });

                if (hp.Loadout) recurse(hp.Loadout, name);
            });
        } else if (typeof hps === 'object' && hps !== null) {
            Object.entries(hps).forEach(([key, val]: [string, any]) => {
                const name = val.name || val.HardpointName || key;
                const type = val.type || (val.ItemTypes?.[0]?.Type) || 'Unknown';
                const size = val.size || val.MaxSize || 0;

                results.push({
                    id: key,
                    name: parentName ? `${parentName} > ${name}` : name,
                    type,
                    size,
                    defaultItem: val.databaseItem
                });

                if (val.Loadout) recurse(val.Loadout, name);
            });
        }
    };

    try {
      const parsed = typeof loadout?.ship_model?.hardpoints === 'string' 
        ? JSON.parse(loadout.ship_model.hardpoints) 
        : loadout?.ship_model?.hardpoints;
      
      recurse(parsed);
      return results;
    } catch (e) {
      return [];
    }
  })();
  
  const groupedHardpoints = {
    weapons: [] as any[],
    systems: [] as any[],
    utility: [] as any[]
  };

  normalizedHardpoints.forEach((hp: any) => {
    const type = hp.type?.toLowerCase() || '';
    const name = hp.name?.toLowerCase() || '';
    
    // Filter out internal technical hardpoints
    if (name.includes('light') || name.includes('helper') || type.includes('room') || type.includes('decal')) {
        return;
    }

    if (type.includes('weapon') || type.includes('missile') || type.includes('turret')) {
        groupedHardpoints.weapons.push(hp);
    } else if (type.includes('shield') || type.includes('power') || type.includes('cooler') || type.includes('quantum')) {
        groupedHardpoints.systems.push(hp);
    } else if (hp.size > 0) {
        groupedHardpoints.utility.push(hp);
    }
  });

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
            {id !== 'new' && (
                <button 
                    onClick={() => setShowApplyModal(true)}
                    className="px-4 py-2 bg-sc-blue/10 border border-sc-blue/30 text-sc-blue text-[10px] font-black rounded uppercase hover:bg-sc-blue hover:text-sc-dark transition-all flex items-center space-x-2 shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.1)]"
                >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Equip to Vessel</span>
                </button>
            )}
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
                    <StatBar 
                        label="Burst Damage (DPS)" 
                        value={calculatedStats.dps.toLocaleString()} 
                        percent={Math.min(100, (calculatedStats.dps / 5000) * 100)} 
                    />
                    <StatBar 
                        label="Shield Endurance" 
                        value={`${calculatedStats.shields.toLocaleString()} HP`} 
                        percent={Math.min(100, (calculatedStats.shields / 20000) * 100)} 
                    />
                    <StatBar 
                        label="Energy Consumption" 
                        value={`${calculatedStats.power.toLocaleString()} W`} 
                        percent={Math.min(100, (calculatedStats.power / 1000) * 100)} 
                        color="bg-sc-blue" 
                    />
                    <StatBar label="Heat Management" value="Stable" percent={45} color="bg-yellow-500" />
                </div>
            </div>
        </div>
      </div>

      {/* Apply to Ship Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-xl">
            <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-lg shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Rocket className="w-5 h-5 text-sc-blue" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Apply Tactical Blueprint</h3>
                    </div>
                    <button onClick={() => setShowApplyModal(false)} className="text-sc-grey/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <p className="text-[10px] text-sc-grey/60 uppercase font-black tracking-widest leading-relaxed">
                        Select a vessel from your personal fleet to synchronize with this tactical blueprint. This will override the vessel's current system configuration.
                    </p>

                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                        {myShips?.filter((s: any) => s.ship_type === loadout?.ship_model?.name).map((ship: any) => (
                            <button 
                                key={ship.id}
                                onClick={() => applyMutation.mutate(ship.id)}
                                disabled={applyMutation.isPending}
                                className="w-full p-4 bg-sc-dark border border-white/5 rounded flex items-center justify-between group hover:border-sc-blue/40 transition-all text-left"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="h-10 w-10 bg-sc-panel border border-sc-blue/10 rounded flex items-center justify-center text-sc-blue/40 group-hover:text-sc-blue transition-colors">
                                        <Rocket className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-white uppercase tracking-widest">{ship.name}</div>
                                        <div className="text-[8px] text-sc-grey/40 uppercase font-mono">{ship.serial_number || 'NO SERIAL'}</div>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-sc-blue/10 border border-sc-blue/30 rounded text-[8px] font-black text-sc-blue uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                    Authorize Link
                                </div>
                            </button>
                        ))}
                        {myShips?.filter((s: any) => s.ship_type === loadout?.ship_model?.name).length === 0 && (
                            <div className="p-12 text-center border border-dashed border-white/5 rounded space-y-4">
                                <div className="text-sc-grey/20 flex justify-center"><Rocket className="w-12 h-12" /></div>
                                <p className="text-[9px] text-sc-grey/40 uppercase font-black tracking-widest">
                                    No compatible <span className="text-white">{loadout?.ship_model?.name}</span> models detected in your fleet registry.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
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
                const displayItem = equipped || hp.defaultItem;
                
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
                        <div className="text-[10px] font-bold text-white uppercase tracking-widest group-hover:text-sc-blue transition-colors truncate">
                            {hp.name.replace(/hardpoint_/g, '').replace(/_/g, ' ')}
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                            <span className={cn(
                                "text-[8px] uppercase font-mono italic truncate max-w-[120px]",
                                equipped ? "text-sc-blue font-bold" : (hp.defaultItem ? "text-sc-blue/60" : "text-sc-grey/40")
                            )}>
                                {displayItem ? (typeof displayItem === 'string' ? displayItem.replace(/_/g, ' ') : displayItem.name) : hp.type || 'Standard Slot'}
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
