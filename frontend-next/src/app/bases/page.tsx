'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Warehouse, 
  MapPin, 
  Shield, 
  Eye, 
  EyeOff, 
  Plus, 
  Activity,
  Box,
  Droplets,
  Zap,
  Lock,
  Globe,
  Settings,
  Trash2,
  X,
  Search,
  ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function BasesPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'my' | 'org'>('my');
  const [editingBase, setEditingBase] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBase, setNewBase] = useState({
    name: '',
    planet: '',
    coordinates: '',
    capabilities: '[]'
  });

  const { data: myBases, isLoading: myLoading } = useQuery({
    queryKey: ['my-bases'],
    queryFn: async () => {
      const res = await api.get('/bases/');
      return res.data;
    },
  });

  const createBaseMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/bases/', data);
    },
    onSuccess: () => {
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ['my-bases'] });
      setNewBase({ name: '', planet: '', coordinates: '', capabilities: '[]' });
    },
  });

  const updateBaseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: any }) => {
      return api.patch(`/bases/${id}`, updates);
    },
    onSuccess: () => {
      setEditingBase(null);
      queryClient.invalidateQueries({ queryKey: ['my-bases'] });
      queryClient.invalidateQueries({ queryKey: ['org-bases'] });
    },
  });

  const deleteBaseMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/bases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bases'] });
    },
  });

  const { data: orgBases, isLoading: orgLoading } = useQuery({
    queryKey: ['org-bases'],
    queryFn: async () => {
      const res = await api.get('/bases/org');
      return res.data;
    },
  });

  const bases = view === 'my' ? myBases : orgBases;
  const isLoading = view === 'my' ? myLoading : orgLoading;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-sc-panel border border-sc-blue/20 p-6 md:p-8 rounded-lg relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-5">
            <Warehouse className="w-48 h-48 text-sc-blue" />
        </div>
        <div className="relative z-10 space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic">Planetary Outpost Registry</h2>
          <p className="text-[10px] text-sc-blue font-mono uppercase tracking-[0.2em]">Base Building & Territorial Asset Management</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto relative z-10">
            <div className="flex bg-sc-dark border border-white/5 rounded p-1 w-full sm:w-auto">
                <button 
                    onClick={() => setView('my')}
                    className={cn(
                        "flex-1 sm:flex-none px-4 py-1.5 text-[9px] font-black uppercase rounded transition-all",
                        view === 'my' ? "bg-sc-blue text-sc-dark" : "text-sc-grey/40 hover:text-white"
                    )}
                >
                    My Assets
                </button>
                <button 
                    onClick={() => setView('org')}
                    className={cn(
                        "flex-1 sm:flex-none px-4 py-1.5 text-[9px] font-black uppercase rounded transition-all",
                        view === 'org' ? "bg-sc-blue text-sc-dark" : "text-sc-grey/40 hover:text-white"
                    )}
                >
                    Org Network
                </button>
            </div>
            <button 
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto px-6 py-2.5 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-black uppercase rounded hover:bg-sc-blue hover:text-sc-dark transition-all flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.1)]"
            >
                <Plus className="w-4 h-4" />
                <span>Establish Outpost</span>
            </button>
        </div>
      </div>

      {/* Bases Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {isLoading ? (
          <div className="col-span-full p-24 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Activity className="w-12 h-12 text-sc-blue opacity-20 animate-pulse" />
              <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic font-mono">Triangulating Surface Signals...</span>
            </div>
          </div>
        ) : bases?.map((base: any) => (
          <BaseCard 
            key={base.id} 
            base={base} 
            isOrgView={view === 'org'} 
            onEdit={setEditingBase}
            onDelete={(id) => deleteBaseMutation.mutate(id)}
          />
        ))}

        {bases?.length === 0 && !isLoading && (
            <div className="col-span-full p-24 text-center bg-sc-panel border border-dashed border-white/5 rounded-lg opacity-40">
                <p className="text-xs font-black uppercase tracking-[0.3em]">No registered outposts detected in current sector.</p>
            </div>
        )}
      </div>

      {/* Establish Outpost Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-md">
            <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-md shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Warehouse className="w-5 h-5 text-sc-blue" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Establish Planetary Anchor</h3>
                    </div>
                    <button onClick={() => setShowAddModal(false)} className="text-sc-grey/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        createBaseMutation.mutate(newBase);
                    }}
                    className="p-8 space-y-6"
                >
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Outpost Designation</label>
                        <input 
                            required
                            value={newBase.name}
                            onChange={(e) => setNewBase({...newBase, name: e.target.value})}
                            placeholder="e.g. Serenity Base, Mining Outpost 7..."
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Planetary Anchor</label>
                        <input 
                            required
                            value={newBase.planet}
                            onChange={(e) => setNewBase({...newBase, planet: e.target.value})}
                            placeholder="e.g. MicroTech, Daymar..."
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Neural Coordinates</label>
                        <input 
                            value={newBase.coordinates}
                            onChange={(e) => setNewBase({...newBase, coordinates: e.target.value})}
                            placeholder="X, Y, Z or OMT Marker"
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none font-mono"
                        />
                    </div>

                    <div className="pt-4 border-t border-white/5 flex justify-end space-x-4">
                        <button 
                            type="button"
                            onClick={() => setShowAddModal(false)}
                            className="px-6 py-2 text-[10px] font-black text-sc-grey/40 hover:text-white uppercase tracking-widest"
                        >
                            Abort
                        </button>
                        <button 
                            type="submit"
                            disabled={createBaseMutation.isPending || !newBase.name || !newBase.planet}
                            className="px-8 py-2 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all disabled:opacity-20"
                        >
                            {createBaseMutation.isPending ? 'Syncing...' : 'Establish Outpost'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Manage Outpost Modal */}
      {editingBase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-xl">
            <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-2xl shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Warehouse className="w-5 h-5 text-sc-blue" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Outpost Management: {editingBase.name}</h3>
                    </div>
                    <button onClick={() => setEditingBase(null)} className="text-sc-grey/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Identity & Location */}
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Outpost Designation</label>
                            <input 
                                defaultValue={editingBase.name}
                                onBlur={(e) => updateBaseMutation.mutate({ id: editingBase.id, updates: { name: e.target.value } })}
                                className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Planetary Anchor</label>
                            <input 
                                defaultValue={editingBase.planet}
                                onBlur={(e) => updateBaseMutation.mutate({ id: editingBase.id, updates: { planet: e.target.value } })}
                                className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Neural Coordinates</label>
                            <input 
                                defaultValue={editingBase.coordinates}
                                onBlur={(e) => updateBaseMutation.mutate({ id: editingBase.id, updates: { coordinates: e.target.value } })}
                                placeholder="X, Y, Z or OMT Marker"
                                className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none font-mono"
                            />
                        </div>
                    </div>

                    {/* Capabilities & Privacy */}
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Tactical Capabilities</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Refining', 'Mining', 'Defense', 'Medical'].map(cap => (
                                    <button 
                                        key={cap}
                                        className="p-2 bg-sc-dark border border-white/5 rounded text-[8px] font-black text-sc-grey/40 uppercase hover:border-sc-blue/20 hover:text-white transition-all flex items-center justify-between"
                                    >
                                        <span>{cap}</span>
                                        <div className="w-1 h-1 rounded-full bg-sc-blue opacity-20"></div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-sc-blue/5 border border-sc-blue/10 rounded space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">Org Signal Broadcast</span>
                                <button className="relative w-8 h-4 rounded-full bg-sc-blue transition-all">
                                    <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-white"></div>
                                </button>
                            </div>
                            <p className="text-[8px] text-sc-grey/60 uppercase leading-relaxed font-bold tracking-tighter">
                                When enabled, organization personnel can view tactical data and location for this outpost.
                            </p>
                        </div>
                    </div>

                    {/* Inventory Section */}
                    <div className="md:col-span-2 pt-6 border-t border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Box className="w-4 h-4 text-sc-blue" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Inventory Manifest</span>
                            </div>
                            <button className="flex items-center space-x-2 text-[8px] font-black text-sc-blue uppercase hover:text-white transition-colors">
                                <Plus className="w-3 h-3" />
                                <span>Provision Item</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 bg-black/40 border border-white/5 rounded flex items-center justify-between">
                                <div className="text-[9px] font-bold text-sc-grey/60 uppercase">No items provisioned</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end">
                    <button 
                        onClick={() => setEditingBase(null)}
                        className="px-8 py-2 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:bg-white transition-all shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.3)]"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

const BaseCard = ({ base, isOrgView, onEdit, onDelete }: { base: any, isOrgView: boolean, onEdit: (b: any) => void, onDelete: (id: number) => void }) => {
    return (
        <div className="bg-sc-panel border border-sc-blue/10 rounded-lg overflow-hidden group hover:border-sc-blue/40 transition-all duration-500 shadow-xl flex flex-col md:flex-row relative">
            {!isOrgView && (
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => onEdit(base)} className="p-2 bg-sc-dark border border-white/10 rounded text-sc-grey/40 hover:text-sc-blue transition-all">
                        <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if(confirm('Decommission outpost?')) onDelete(base.id); }} className="p-2 bg-sc-dark border border-white/10 rounded text-sc-grey/40 hover:text-red-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
            {/* Map/Location Side */}
            <div className="md:w-48 bg-sc-dark border-r border-sc-grey/5 p-8 flex flex-col items-center justify-center space-y-4 group-hover:bg-black/40 transition-colors relative">
                <div className="h-20 w-20 rounded-full border border-sc-blue/20 flex items-center justify-center text-sc-blue/20 group-hover:text-sc-blue transition-all duration-700 relative">
                    <MapPin className="w-10 h-10" />
                    <div className="absolute inset-0 border border-sc-blue/40 rounded-full animate-ping opacity-20"></div>
                </div>
                <div className="text-center">
                    <div className="text-[10px] font-black text-white uppercase tracking-widest">{base.planet}</div>
                    <div className="text-[8px] font-mono text-sc-grey/40 uppercase mt-1">{base.coordinates || 'COORDS_UNSET'}</div>
                </div>
            </div>

            {/* Info Content */}
            <div className="flex-1 p-8 space-y-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight italic">{base.name}</h3>
                            {isOrgView && (
                                <span className="text-[8px] font-black text-sc-blue/40 uppercase border border-sc-blue/20 px-1.5 py-0.5 rounded">Owner: {base.user?.display_name}</span>
                            )}
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="text-[8px] font-black text-green-500 uppercase tracking-widest flex items-center">
                                <div className="w-1 h-1 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                                System Active
                            </span>
                            <span className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">•</span>
                            <div className="flex items-center space-x-1.5">
                                {base.is_private ? <Lock className="w-2.5 h-2.5 text-sc-grey/40" /> : <Globe className="w-2.5 h-2.5 text-sc-blue/40" />}
                                <span className="text-[8px] font-black text-sc-grey/40 uppercase">Org Sharing: {base.is_private ? 'Off' : 'Active'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Capabilities Tags */}
                <div className="flex flex-wrap gap-2">
                    {['Refining', 'Mining', 'Defense', 'Research'].map(tag => (
                        <span key={tag} className="px-2 py-1 bg-black/40 border border-white/5 rounded text-[8px] font-bold text-sc-grey/40 uppercase tracking-tighter hover:border-sc-blue/20 hover:text-sc-blue transition-all cursor-default">
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Stats / Inventory Preview */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sc-grey/40">
                            <Zap className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase">Power Output</span>
                        </div>
                        <div className="text-xs font-bold text-white uppercase">14.2 GW</div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sc-grey/40">
                            <Box className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase">Resource Stock</span>
                        </div>
                        <div className="text-xs font-bold text-white uppercase">84% Capacity</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
