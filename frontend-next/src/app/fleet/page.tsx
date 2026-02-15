'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { 
  Rocket, 
  Upload, 
  Plus, 
  MoreVertical, 
  Shield, 
  AlertTriangle,
  ChevronRight,
  Info,
  X,
  Database,
  Search,
  Box,
  LayoutGrid,
  LayoutList,
  Zap,
  Weight,
  Anchor,
  CheckSquare,
  Square,
  MapPin,
  Save,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ShipSystemsModal = ({ ship, onClose, onUpdate }: { ship: any, onClose: () => void, onUpdate: any }) => {
  const [location, setLocation] = useState(ship.location || '');

  const handleSave = () => {
    onUpdate.mutate({
      id: ship.id,
      updates: {
        location,
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-md">
        <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-2xl shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-sc-blue" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{ship.ship_type} Systems Management</h3>
                </div>
                <button onClick={onClose} className="text-sc-grey/40 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Location Section */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
                        <MapPin className="w-4 h-4 text-sc-blue" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Stationary Coordinates</span>
                    </div>
                    <div className="flex space-x-4">
                        <input 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Port Olisar, Stanton II"
                            className="flex-1 bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 bg-black/40 border-t border-sc-blue/10 flex justify-end space-x-4">
                <button 
                    onClick={onClose}
                    className="px-6 py-2 text-[10px] font-black text-sc-grey/40 hover:text-white uppercase tracking-widest"
                >
                    Discard Changes
                </button>
                <button 
                    onClick={handleSave}
                    disabled={onUpdate.isPending}
                    className="px-8 py-2 bg-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all flex items-center space-x-2"
                >
                    <Save className="w-4 h-4" />
                    <span>{onUpdate.isPending ? 'Synchronizing...' : 'Save Configuration'}</span>
                </button>
            </div>
        </div>
    </div>
  );
};

const ShipBlueprintModal = ({ model, onClose }: { model: any, onClose: () => void }) => {
  const stats = (() => {
    try {
      const parsed = typeof model.base_stats === 'string' ? JSON.parse(model.base_stats) : model.base_stats;
      return parsed || {};
    } catch (e) {
      return {};
    }
  })();

  const getDeepStat = (obj: any, path: string): any => {
    return path.split('.').reduce((prev, curr) => prev?.[curr], obj);
  };

  const scmSpeed = stats.ScmSpeed || stats.scm_speed || stats.Speed || 
                   getDeepStat(stats, 'Speeds.Scm') || 
                   getDeepStat(stats, 'FlightCharacteristics.Speeds.Scm') || 
                   getDeepStat(stats, 'FlightCharacteristics.IFCS.ScmSpeed') || '--';

  const maxSpeed = stats.AfterburnerSpeed || stats.afterburner_speed || stats.MaxSpeed || 
                   getDeepStat(stats, 'Speeds.Max') || 
                   getDeepStat(stats, 'FlightCharacteristics.Speeds.Max') || 
                   getDeepStat(stats, 'FlightCharacteristics.IFCS.MaxSpeed') || '--';

  const hardpoints = (() => {
    try {
      const parsed = typeof model.hardpoints === 'string' ? JSON.parse(model.hardpoints) : model.hardpoints;
      if (Array.isArray(parsed)) {
        return parsed.map((hp: any) => ({
          name: hp.name || hp.HardpointName || hp.category || 'Hardpoint',
          installedItem: hp.installedItem || hp.ClassName || hp.InstalledItem || null,
          size: hp.size || hp.MaxSize || 0,
          type: hp.type || (hp.ItemTypes?.[0]?.Type) || 'Unknown'
        }));
      }
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.entries(parsed).map(([key, val]: [string, any]) => ({
          name: key,
          ...(typeof val === 'object' ? {
            installedItem: val.installedItem || val.ClassName || val.InstalledItem,
            size: val.size || val.MaxSize,
            type: val.type || (val.ItemTypes?.[0]?.Type)
          } : { installedItem: val })
        }));
      }
      return [];
    } catch (e) {
      return [];
    }
  })();

  // Filter out non-interactable or trivial hardpoints
  const filteredHardpoints = hardpoints.filter((hp: any) => {
    const n = hp.name?.toLowerCase() || '';
    const t = hp.type?.toLowerCase() || '';
    return !n.includes('light') && !n.includes('helper') && !t.includes('room') && !t.includes('decal');
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-md">
        <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-4xl shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <Database className="w-5 h-5 text-sc-blue" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">UEE Technical Blueprint: {model.name}</h3>
                </div>
                <button onClick={onClose} className="text-sc-grey/40 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                {/* Left Col: Info & Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="space-y-1">
                        <div className="text-[10px] font-black text-sc-blue uppercase tracking-[0.2em]">{model.manufacturer}</div>
                        <h2 className="text-3xl font-bold text-white italic tracking-tight uppercase">{model.name}</h2>
                        <div className="inline-block px-2 py-0.5 bg-sc-blue/10 border border-sc-blue/20 rounded text-[10px] font-mono text-sc-blue uppercase">
                            {model.ship_class || 'Classification Pending'}
                        </div>
                    </div>

                    <p className="text-xs text-sc-grey/60 leading-relaxed italic border-l-2 border-sc-grey/10 pl-4">
                        {model.description || "Official UEE technical documentation for this vessel class is currently restricted or pending synchronization."}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <StatBox label="Mass" value={`${(model.mass || stats.Mass || stats.MassTotal || 0).toLocaleString()} kg`} />
                        <StatBox label="Cargo" value={`${model.cargo_capacity || stats.Cargo || stats.CargoCapacity || 0} SCU`} />
                        <StatBox label="SCM Speed" value={`${scmSpeed} m/s`} />
                        <StatBox label="Afterburner" value={`${maxSpeed} m/s`} />
                    </div>
                </div>

                {/* Right Col: Components & Weapons */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
                            <Zap className="w-4 h-4 text-sc-blue" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Standard Issue Components</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredHardpoints.length > 0 ? (
                                filteredHardpoints.map((hp: any, i: number) => (
                                    <div key={i} className="flex items-center space-x-3 p-3 bg-black/20 border border-white/5 rounded">
                                        <div className="w-8 h-8 bg-sc-dark rounded flex items-center justify-center border border-white/5">
                                            {hp.type?.includes('Weapon') ? <Rocket className="w-4 h-4 text-sc-blue/40" /> : <Box className="w-4 h-4 text-sc-grey/40" />}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest truncate">{hp.name.replace(/hardpoint_/g, '').replace(/_/g, ' ')}</span>
                                            <span className="text-[10px] text-white font-bold truncate">
                                                {hp.installedItem ? (
                                                    hp.installedItem.replace(/_/g, ' ')
                                                ) : (
                                                    hp.size > 0 ? `Size ${hp.size} Slot` : 'Integrated System'
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-8 text-center text-[10px] text-sc-grey/30 uppercase italic font-bold">
                                    No component data available for this model.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-black/40 border-t border-sc-blue/10 flex justify-end space-x-4">
                <button 
                    onClick={onClose}
                    className="px-8 py-2 bg-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all"
                >
                    Close Blueprint
                </button>
            </div>
        </div>
    </div>
  );
};

const StatBox = ({ label, value }: { label: string, value: string }) => (
    <div className="bg-black/20 border border-white/5 p-3 rounded text-center">
        <div className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest mb-1">{label}</div>
        <div className="text-xs font-mono text-white">{value}</div>
    </div>
);

function FleetContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'my-ships' | 'database'>('my-ships');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedShips, setSelectedShips] = useState<number[]>([]);
  const [selectedShipSystems, setSelectedShipSystems] = useState<any>(null);
  const [selectedShipModel, setSelectedShipModel] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShip, setNewShip] = useState({
    name: '',
    ship_type: '',
    serial_number: '',
    insurance_status: 'Standard'
  });

  // Database filters
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [dbManufacturer, setDbManufacturer] = useState('');
  const [dbClass, setDbClass] = useState('');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'database' || tab === 'my-ships') {
      setActiveTab(tab as any);
    }
  }, [searchParams]);
  
  const { data: ships, isLoading: isShipsLoading } = useQuery({
    queryKey: ['my-ships'],
    queryFn: async () => {
      const res = await api.get('/ships/');
      return res.data;
    },
    enabled: activeTab === 'my-ships',
  });

  const { data: shipModels } = useQuery({
    queryKey: ['ship-models-fleet'],
    queryFn: async () => {
      const res = await api.get('/game-data/ships');
      return res.data;
    },
  });

  const { data: dbShips, isLoading: isDbLoading } = useQuery({
    queryKey: ['ship-database', dbSearchQuery, dbManufacturer, dbClass],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dbSearchQuery) params.append('q', dbSearchQuery);
      if (dbManufacturer) params.append('manufacturer', dbManufacturer);
      if (dbClass) params.append('class', dbClass);
      const res = await api.get(`/game-data/ships?${params.toString()}`);
      return res.data;
    },
    enabled: activeTab === 'database',
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, update }: { ids: number[], update: any }) => {
      return api.patch('/ships/bulk', { ids, update });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ships'] });
      setSelectedShips([]);
    },
  });

  const toggleShipSelection = (id: number) => {
    setSelectedShips(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedShips.length === ships?.length) {
      setSelectedShips([]);
    } else {
      setSelectedShips(ships?.map((s: any) => s.id) || []);
    }
  };

  const createShipMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/ships/', data);
    },
    onSuccess: () => {
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ['my-ships'] });
      setNewShip({ name: '', ship_type: '', serial_number: '', insurance_status: 'Standard' });
    },
  });

  const updateShipMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: any }) => {
      return api.patch(`/ships/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ships'] });
      if (selectedShipSystems) {
        // Find the updated ship in the local state or just close and let it refetch
        setSelectedShipSystems(null);
      }
    },
  });

  const importHangarMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/ships/import-hangarxplorer', data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-ships'] });
      alert(res.data.message || `Successfully imported ${res.data.count} vessels!`);
    },
    onError: (err: any) => {
      console.error('Import error:', err);
      alert(err.response?.data || 'Tactical data sync failed. Ensure the JSON format is compatible.');
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        importHangarMutation.mutate(json);
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const statusColors: Record<string, string> = {
    ready: 'text-green-400',
    damaged: 'text-yellow-400',
    destroyed: 'text-red-400',
    stored: 'text-sc-grey/60',
  };

  const manufacturers = Array.from(new Set(shipModels?.map((m: any) => m.manufacturer) || [])).sort() as string[];
  const classes = Array.from(new Set(shipModels?.map((m: any) => m.ship_class) || [])).filter(Boolean).sort() as string[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end space-y-4 md:space-y-0">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Fleet Command
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            {activeTab === 'my-ships' ? 'Vessel Database & Readiness Monitor' : 'UEE Global Ship Registry'}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex bg-black/40 border border-sc-grey/10 p-1 rounded backdrop-blur-md self-start">
            <button 
              onClick={() => setActiveTab('my-ships')}
              className={cn(
                "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center space-x-2",
                activeTab === 'my-ships' ? "bg-sc-blue text-white" : "text-sc-grey/40 hover:text-sc-grey"
              )}
            >
              <Rocket className="w-3 h-3" />
              <span>Active Fleet</span>
            </button>
            <button 
              onClick={() => setActiveTab('database')}
              className={cn(
                "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center space-x-2",
                activeTab === 'database' ? "bg-sc-blue text-white" : "text-sc-grey/40 hover:text-sc-grey"
              )}
            >
              <Database className="w-3 h-3" />
              <span>Ship Database</span>
            </button>
          </div>

          {activeTab === 'my-ships' && (
            <div className="flex bg-black/40 border border-sc-grey/10 p-1 rounded backdrop-blur-md self-start">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-1.5 rounded transition-all",
                  viewMode === 'grid' ? "bg-sc-blue text-sc-dark" : "text-sc-grey/40 hover:text-sc-grey"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded transition-all",
                  viewMode === 'list' ? "bg-sc-blue text-sc-dark" : "text-sc-grey/40 hover:text-sc-grey"
                )}
              >
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'my-ships' ? (
        <>
          <div className="flex justify-between items-center bg-sc-panel/50 p-4 border border-sc-grey/10 rounded">
            <div className="flex items-center space-x-4">
                <button 
                  onClick={toggleAllSelection}
                  className="text-sc-blue hover:text-white transition-colors"
                >
                  {selectedShips.length > 0 && selectedShips.length === ships?.length ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
                <div className="text-[10px] font-black text-sc-blue uppercase tracking-widest">Fleet Operations</div>
                <div className="h-4 w-px bg-sc-grey/10"></div>
                <div className="text-[10px] font-mono text-sc-grey/40 uppercase">
                  {selectedShips.length > 0 ? `${selectedShips.length} Selected` : `${ships?.length || 0} Vessels commissioned`}
                </div>

                {selectedShips.length > 0 && (
                  <div className="flex items-center space-x-2 ml-4 animate-in fade-in slide-in-from-left-2">
                    <span className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Set Status:</span>
                    {['ready', 'damaged', 'destroyed', 'stored'].map((status) => (
                      <button
                        key={status}
                        onClick={() => bulkUpdateMutation.mutate({ ids: selectedShips, update: { status } })}
                        className={cn(
                          "px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter border transition-all",
                          status === 'ready' && "border-green-500/30 text-green-500 hover:bg-green-500/10",
                          status === 'damaged' && "border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10",
                          status === 'destroyed' && "border-red-500/30 text-red-500 hover:bg-red-500/10",
                          status === 'stored' && "border-sc-grey/30 text-sc-grey hover:bg-sc-grey/10"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-sc-grey/10 border border-sc-grey/30 text-sc-grey text-xs font-bold uppercase tracking-widest hover:bg-sc-grey/20 transition-all flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".json" 
                className="hidden" 
              />
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Register
              </button>
            </div>
          </div>

          {isShipsLoading ? (
            <div className="flex justify-center p-24">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue shadow-[0_0_15px_rgba(102,252,241,0.3)]"></div>
            </div>
          ) : !ships || ships.length === 0 ? (
            <div className="bg-sc-panel border border-sc-grey/10 p-24 text-center rounded relative overflow-hidden">
              <Rocket className="w-16 h-16 text-sc-grey/10 mx-auto mb-4" />
              <p className="text-sc-grey/40 uppercase tracking-[0.3em] text-sm">No vessels currently assigned to your command.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ships.map((ship: any) => (
                <div 
                  key={ship.id} 
                  className={cn(
                    "bg-sc-panel border rounded overflow-hidden group hover:border-sc-blue/30 transition-all duration-300 shadow-xl flex flex-col relative",
                    selectedShips.includes(ship.id) ? "border-sc-blue shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.1)]" : "border-sc-grey/10"
                  )}
                >
                  {/* Selection Overlay */}
                  <button 
                    onClick={() => toggleShipSelection(ship.id)}
                    className={cn(
                      "absolute top-2 left-2 z-10 p-1 rounded backdrop-blur-md border transition-all",
                      selectedShips.includes(ship.id) ? "bg-sc-blue border-sc-blue text-sc-dark" : "bg-black/40 border-white/10 text-white/20 opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>

                  <div className="h-24 bg-sc-dark p-4 flex flex-col justify-end relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 text-[8px] font-mono text-sc-grey/20">
                      REF_{ship.id.toString().padStart(4, '0')}
                    </div>
                    <div className="text-[10px] text-sc-blue font-black uppercase tracking-widest mb-1 truncate">
                      {ship.ship_type}
                    </div>
                    <div className="text-lg font-bold text-white truncate italic tracking-tight">
                      {ship.name || 'Unnamed Vessel'}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-sc-panel to-transparent opacity-50"></div>
                  </div>
                  
                  <div className="p-4 flex-1 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-sc-grey/30 uppercase tracking-widest block">Serial</span>
                        <span className="text-[10px] text-sc-grey font-mono truncate block">
                          {ship.serial_number || '---'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-sc-grey/30 uppercase tracking-widest block">Insurance</span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase block",
                          ship.insurance_status?.toLowerCase().includes('lti') ? 'text-sc-blue' : 'text-yellow-500'
                        )}>
                          {ship.insurance_status || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-black text-sc-grey/30 uppercase tracking-widest block">Current Status</span>
                      <select 
                        value={ship.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateShipMutation.mutate({ id: ship.id, updates: { status: e.target.value } })}
                        className={cn(
                          "w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-sc-blue/50 transition-all",
                          statusColors[ship.status]
                        )}
                      >
                        <option value="ready">Ready for Launch</option>
                        <option value="damaged">Damage Sustained</option>
                        <option value="destroyed">Vessel Lost</option>
                        <option value="stored">In Hangar</option>
                      </select>
                    </div>

                    {ship.location && (
                      <div className="pt-2 border-t border-white/5 flex items-center space-x-2">
                        <MapPin className="w-3 h-3 text-sc-blue/40" />
                        <span className="text-[9px] text-sc-grey/60 uppercase font-bold truncate">{ship.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-2 bg-black/20 border-t border-sc-grey/5 flex justify-between items-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedShipSystems(ship); }}
                      className="text-[9px] text-sc-blue/50 hover:text-sc-blue uppercase font-black tracking-widest transition-colors flex items-center"
                    >
                      <Info className="w-3 h-3 mr-1" />
                      View Systems
                    </button>
                    <MoreVertical className="w-3 h-3 text-sc-grey/20 cursor-pointer hover:text-white transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden shadow-2xl">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/40 border-b border-sc-grey/10">
                      <th className="p-4 w-10"></th>
                      <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Designation</th>
                      <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Model / Class</th>
                      <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Insurance</th>
                      <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Readiness</th>
                      <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest text-right">Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sc-grey/5">
                    {ships.map((ship: any) => (
                      <tr 
                        key={ship.id} 
                        onClick={() => toggleShipSelection(ship.id)}
                        className={cn(
                          "hover:bg-sc-blue/[0.02] transition-colors cursor-pointer group",
                          selectedShips.includes(ship.id) && "bg-sc-blue/[0.05]"
                        )}
                      >
                        <td className="p-4">
                          <div className={cn(
                            "w-4 h-4 rounded border transition-all flex items-center justify-center",
                            selectedShips.includes(ship.id) ? "bg-sc-blue border-sc-blue text-sc-dark" : "border-sc-grey/20 group-hover:border-sc-blue/50"
                          )}>
                            {selectedShips.includes(ship.id) && <CheckSquare className="w-3 h-3" />}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white tracking-tight uppercase italic">{ship.name || 'Unnamed Vessel'}</span>
                            <span className="text-[8px] text-sc-grey/30 font-mono">SN: {ship.serial_number || 'NOT_REGISTERED'}</span>
                          </div>
                        </td>
                                                  <td className="p-4">
                                                    <div className="flex flex-col">
                                                      <span className="text-[10px] font-bold text-sc-blue uppercase tracking-widest">{ship.ship_type}</span>
                                                      <div className="flex items-center space-x-1">
                                                        <MapPin className="w-2.5 h-2.5 text-sc-grey/30" />
                                                        <span className="text-[8px] text-sc-grey/40 uppercase font-mono">{ship.location || 'Unknown Coordinates'}</span>
                                                      </div>
                                                    </div>
                                                  </td>
                        
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border",
                            ship.insurance_status?.toLowerCase().includes('lti') 
                              ? "bg-sc-blue/10 border-sc-blue/20 text-sc-blue" 
                              : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                          )}>
                            {ship.insurance_status || 'Standard'}
                          </span>
                        </td>
                        <td className="p-4">
                          <select 
                            value={ship.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateShipMutation.mutate({ id: ship.id, updates: { status: e.target.value } })}
                            className={cn(
                              "bg-sc-dark/50 border border-sc-grey/20 rounded px-2 py-1 text-[9px] font-bold uppercase tracking-widest outline-none focus:border-sc-blue/50 transition-all",
                              statusColors[ship.status]
                            )}
                          >
                            <option value="ready">Ready</option>
                            <option value="damaged">Damaged</option>
                            <option value="destroyed">Lost</option>
                            <option value="stored">Stored</option>
                          </select>
                        </td>
                                                  <td className="p-4 text-right">
                                                    <button 
                                                      onClick={(e) => { e.stopPropagation(); setSelectedShipSystems(ship); }}
                                                      className="p-1.5 hover:bg-sc-blue/10 rounded text-sc-grey/40 hover:text-sc-blue transition-all"
                                                    >
                                                      <Info className="w-4 h-4" />
                                                    </button>
                                                  </td>
                        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden">
                <div className="bg-black/40 p-3 border-b border-sc-grey/10 flex items-center space-x-2">
                    <Anchor className="w-3 h-3 text-sc-blue" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Manufacturers</span>
                </div>
                <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar space-y-1">
                    <button
                        onClick={() => setDbManufacturer('')}
                        className={cn(
                            "w-full text-left px-3 py-2 text-[10px] uppercase tracking-wider font-bold transition-all border-l-2",
                            dbManufacturer === '' 
                            ? "bg-sc-blue/10 border-sc-blue text-sc-blue" 
                            : "border-transparent text-sc-grey/40 hover:text-sc-grey hover:bg-white/5"
                        )}
                    >
                        All Manufacturers
                    </button>
                    {manufacturers.map((m) => (
                    <button
                        key={m}
                        onClick={() => setDbManufacturer(m)}
                        className={cn(
                        "w-full text-left px-3 py-2 text-[10px] uppercase tracking-wider font-bold transition-all border-l-2",
                        dbManufacturer === m 
                            ? "bg-sc-blue/10 border-sc-blue text-sc-blue" 
                            : "border-transparent text-sc-grey/40 hover:text-sc-grey hover:bg-white/5"
                        )}
                    >
                        {m}
                    </button>
                    ))}
                </div>
            </div>

            <div className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden">
                <div className="bg-black/40 p-3 border-b border-sc-grey/10 flex items-center space-x-2">
                    <LayoutGrid className="w-3 h-3 text-sc-blue" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Ship Class</span>
                </div>
                <div className="p-2 space-y-1">
                    <button
                        onClick={() => setDbClass('')}
                        className={cn(
                            "w-full text-left px-3 py-2 text-[10px] uppercase tracking-wider font-bold transition-all border-l-2",
                            dbClass === '' 
                            ? "bg-sc-blue/10 border-sc-blue text-sc-blue" 
                            : "border-transparent text-sc-grey/40 hover:text-sc-grey hover:bg-white/5"
                        )}
                    >
                        All Classes
                    </button>
                    {classes.map((c) => (
                    <button
                        key={c}
                        onClick={() => setDbClass(c)}
                        className={cn(
                        "w-full text-left px-3 py-2 text-[10px] uppercase tracking-wider font-bold transition-all border-l-2",
                        dbClass === c 
                            ? "bg-sc-blue/10 border-sc-blue text-sc-blue" 
                            : "border-transparent text-sc-grey/40 hover:text-sc-grey hover:bg-white/5"
                        )}
                    >
                        {c}
                    </button>
                    ))}
                </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="lg:col-span-3 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sc-grey/40" />
              <input 
                value={dbSearchQuery}
                onChange={(e) => setDbSearchQuery(e.target.value)}
                type="text" 
                placeholder="Query UEE ship records..." 
                className="w-full bg-sc-panel border border-sc-grey/10 rounded pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all placeholder-sc-grey/20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isDbLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-40 bg-sc-panel/50 border border-sc-grey/5 rounded animate-pulse" />
                    ))
                ) : dbShips?.length > 0 ? (
                    dbShips.map((ship: any) => (
                        <div key={ship.id} className="bg-sc-panel border border-sc-grey/10 rounded p-5 hover:border-sc-blue/30 transition-all group flex flex-col space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="text-[8px] font-black text-sc-blue uppercase tracking-[0.2em]">{ship.manufacturer}</div>
                                    <h4 className="text-base font-bold text-white italic tracking-tight group-hover:text-sc-blue transition-colors">{ship.name}</h4>
                                </div>
                                <div className="px-2 py-1 bg-black/40 border border-white/5 rounded text-[8px] font-mono text-sc-grey/40 uppercase">
                                    {ship.ship_class || 'General'}
                                </div>
                            </div>

                            <p className="text-[10px] text-sc-grey/50 line-clamp-2 leading-relaxed italic">
                                {ship.description || "Official UEE technical documentation pending synchronization."}
                            </p>

                            <div className="pt-4 border-t border-sc-grey/5 flex justify-between items-center">
                                <div className="flex space-x-4">
                                    <div className="flex items-center space-x-1.5">
                                        <Weight className="w-3 h-3 text-sc-grey/20" />
                                        <span className="text-[10px] font-mono text-sc-grey/40">{ship.mass?.toLocaleString() || '--'} kg</span>
                                    </div>
                                    <div className="flex items-center space-x-1.5">
                                        <Box className="w-3 h-3 text-sc-grey/20" />
                                        <span className="text-[10px] font-mono text-sc-grey/40">{ship.cargo_capacity || '0'} SCU</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedShipModel(ship)}
                                    className="text-[9px] font-black uppercase tracking-widest text-sc-blue/60 hover:text-sc-blue transition-colors flex items-center space-x-1"
                                >
                                    <span>Blueprint</span>
                                    <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-24 text-center bg-sc-panel/30 border border-dashed border-sc-grey/10 rounded">
                        <Rocket className="w-12 h-12 text-sc-grey/10 mx-auto mb-4" />
                        <p className="text-xs uppercase tracking-widest text-sc-grey/40 italic">No matching vessels found in central archives.</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Commissioning Modal (Copied from original) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-md">
            <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-xl shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Rocket className="w-5 h-5 text-sc-blue" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Ship Commissioning Authorization</h3>
                    </div>
                    <button onClick={() => setShowAddModal(false)} className="text-sc-grey/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        createShipMutation.mutate(newShip);
                    }}
                    className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Vessel Custom Name</label>
                        <input 
                            required
                            value={newShip.name}
                            onChange={(e) => setNewShip({...newShip, name: e.target.value})}
                            placeholder="e.g. Spirit of Stanton"
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Ship Model (Class)</label>
                        <select 
                            required
                            value={newShip.ship_type}
                            onChange={(e) => setNewShip({...newShip, ship_type: e.target.value})}
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none appearance-none"
                        >
                            <option value="">Select Model...</option>
                            {shipModels?.map((m: any) => (
                                <option key={m.id} value={m.name}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Registry Serial Number</label>
                        <input 
                            value={newShip.serial_number}
                            onChange={(e) => setNewShip({...newShip, serial_number: e.target.value})}
                            placeholder="e.g. SN-123456"
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none font-mono"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Insurance Protocol</label>
                        <select 
                            value={newShip.insurance_status}
                            onChange={(e) => setNewShip({...newShip, insurance_status: e.target.value})}
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none appearance-none"
                        >
                            <option value="LTI">Lifetime Insurance (LTI)</option>
                            <option value="SHI">Standard Hull (SHI)</option>
                            <option value="Expired">Protocol Expired</option>
                        </select>
                    </div>

                    <div className="md:col-span-2 p-4 bg-sc-blue/5 border border-sc-blue/10 rounded flex items-start space-x-3">
                        <Shield className="w-4 h-4 text-sc-blue mt-0.5" />
                        <p className="text-[9px] text-sc-grey/60 uppercase leading-relaxed font-bold tracking-widest">
                            Authorized commission will synchronize this vessel with organization tactical data and mission readiness calculations.
                        </p>
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-white/5 flex justify-end space-x-4">
                        <button 
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="px-6 py-2 text-[10px] font-black text-sc-grey/40 hover:text-white uppercase tracking-widest"
                        >
                            Abort
                        </button>
                        <button 
                            type="submit"
                            disabled={createShipMutation.isPending || !newShip.name || !newShip.ship_type}
                            className="px-8 py-2 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all disabled:opacity-20"
                        >
                            {createShipMutation.isPending ? 'Syncing...' : 'Authorize Commission'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Ship Systems Management Modal */}
      {selectedShipSystems && (
        <ShipSystemsModal 
          ship={selectedShipSystems} 
          onClose={() => setSelectedShipSystems(null)}
          onUpdate={updateShipMutation}
        />
      )}

      {/* Ship Blueprint Modal */}
      {selectedShipModel && (
        <ShipBlueprintModal 
          model={selectedShipModel} 
          onClose={() => setSelectedShipModel(null)} 
        />
      )}
    </div>
  );
}

export default function FleetPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center p-24 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-sc-blue"></div>
                <span className="text-xs text-sc-grey/40 uppercase tracking-widest font-mono italic">Synchronizing fleet data link...</span>
            </div>
        }>
            <FleetContent />
        </Suspense>
    );
}
