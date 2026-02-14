'use client';

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FleetPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShip, setNewShip] = useState({
    name: '',
    ship_type: '',
    serial_number: '',
    insurance_status: 'Standard'
  });
  
  const { data: ships, isLoading } = useQuery({
    queryKey: ['my-ships'],
    queryFn: async () => {
      const res = await api.get('/ships/');
      return res.data;
    },
  });

  const { data: shipModels } = useQuery({
    queryKey: ['ship-models-fleet'],
    queryFn: async () => {
      const res = await api.get('/game-data/ships');
      return res.data;
    },
  });

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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      return api.patch(`/ships/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ships'] });
    },
  });

  const importHangarMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/ships/import-hangarxplorer', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ships'] });
      alert('Hangar imported successfully!');
    },
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Fleet Registry
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Vessel Database & Readiness Monitor
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-sc-grey/10 border border-sc-grey/30 text-sc-grey text-xs font-bold uppercase tracking-widest hover:bg-sc-grey/20 transition-all flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Hangar
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
            Register Vessel
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue shadow-[0_0_15px_rgba(102,252,241,0.3)]"></div>
        </div>
      ) : !ships || ships.length === 0 ? (
        <div className="bg-sc-panel border border-sc-grey/10 p-24 text-center rounded relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none"></div>
          <Rocket className="w-16 h-16 text-sc-grey/10 mx-auto mb-4" />
          <p className="text-sc-grey/40 uppercase tracking-[0.3em] text-sm">No signals detected in your sector.</p>
          <button className="mt-6 text-sc-blue text-[10px] font-black uppercase tracking-widest hover:underline">
            Initiate Hangar Scan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ships.map((ship: any) => (
            <div 
              key={ship.id} 
              className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden group hover:border-sc-blue/30 transition-all duration-300 shadow-xl flex flex-col"
            >
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
                    onChange={(e) => updateStatusMutation.mutate({ id: ship.id, status: e.target.value })}
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
              </div>

              <div className="px-4 py-2 bg-black/20 border-t border-sc-grey/5 flex justify-between items-center">
                <button className="text-[9px] text-sc-blue/50 hover:text-sc-blue uppercase font-black tracking-widest transition-colors flex items-center">
                  <Info className="w-3 h-3 mr-1" />
                  View Systems
                </button>
                <MoreVertical className="w-3 h-3 text-sc-grey/20 cursor-pointer hover:text-white transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Commissioning Modal */}
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
    </div>
  );
}
