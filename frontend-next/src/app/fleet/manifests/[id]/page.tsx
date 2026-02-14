'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Package, 
  ChevronLeft, 
  Search, 
  ArrowRight, 
  Save, 
  Trash2,
  Plus,
  Minus,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ManifestBuilderPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [manifestName, setManifestName] = useState('New Equipment Set');

  const { data: items } = useQuery({
    queryKey: ['game-items-manifest', searchTerm],
    queryFn: async () => {
      const res = await api.get(`/game-data/items?q=${searchTerm}`);
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: manifestName,
        items: JSON.stringify(selectedItems.map(si => ({ uuid: si.item.uuid, name: si.item.name, quantity: si.quantity }))),
        description: 'Operational ground gear manifest'
      };
      if (id === 'new') return api.post('/game-data/manifests', payload);
      return api.patch(`/game-data/manifests/${id}`, payload);
    },
    onSuccess: () => {
      alert('Manifest saved to logistics bank.');
      queryClient.invalidateQueries({ queryKey: ['equipment-manifests'] });
    }
  });

  const addItem = (item: any) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.item.uuid === item.uuid);
      if (existing) {
        return prev.map(i => i.item.uuid === item.uuid ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeItem = (uuid: string) => {
    setSelectedItems(prev => prev.filter(i => i.item.uuid !== uuid));
  };

  const updateQuantity = (uuid: string, delta: number) => {
    setSelectedItems(prev => prev.map(i => {
      if (i.item.uuid === uuid) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-black/40 border border-white/5 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
            <Link href="/fleet/manifests" className="p-2 hover:bg-white/5 rounded text-sc-grey/40 hover:text-white transition-all">
                <ChevronLeft className="w-5 h-5" />
            </Link>
            <input 
                value={manifestName}
                onChange={(e) => setManifestName(e.target.value)}
                className="bg-transparent border-none text-sm font-black text-white uppercase tracking-widest focus:outline-none focus:ring-0 w-64"
            />
        </div>
        <button 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="px-6 py-2 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all flex items-center space-x-2 disabled:opacity-20"
        >
            <Save className="w-3.5 h-3.5" />
            <span>{saveMutation.isPending ? 'Synchronizing...' : 'Finalize Manifest'}</span>
        </button>
      </div>

      <div className="flex-1 flex space-x-6 min-h-0">
        {/* Left: Component Browser */}
        <div className="w-96 flex flex-col bg-sc-panel border border-white/5 rounded-lg overflow-hidden">
            <div className="p-4 bg-black/20 border-b border-white/5 flex items-center space-x-3">
                <Search className="w-4 h-4 text-sc-blue" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Item Registry Search</span>
            </div>
            <div className="p-4 border-b border-white/5">
                <input 
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-4 py-2 text-[10px] text-white focus:outline-none focus:border-sc-blue/50 uppercase tracking-widest font-bold"
                />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {items?.map((item: any) => (
                    <button 
                        key={item.id} 
                        onClick={() => addItem(item)}
                        className="w-full text-left p-3 rounded hover:bg-sc-blue/5 border border-transparent hover:border-sc-blue/20 group transition-all flex justify-between items-center"
                    >
                        <div>
                            <div className="text-[10px] font-black text-white uppercase group-hover:text-sc-blue">{item.name}</div>
                            <div className="text-[8px] text-sc-grey/40 uppercase font-mono">{item.category} • {item.manufacturer}</div>
                        </div>
                        <Plus className="w-3 h-3 text-sc-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                ))}
            </div>
        </div>

        {/* Right: Active Manifest */}
        <div className="flex-1 bg-sc-panel border border-sc-blue/20 rounded-lg flex flex-col overflow-hidden shadow-2xl relative">
            <div className="p-4 bg-black/20 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Package className="w-4 h-4 text-sc-blue" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Active Provisioning List</span>
                </div>
                <div className="px-3 py-1 bg-sc-blue/10 border border-sc-blue/30 rounded text-[8px] font-bold text-sc-blue uppercase">
                    {selectedItems.length} Unique SKUs
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {selectedItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
                        <Info className="w-12 h-12" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">No items provisioned in this manifest</span>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {selectedItems.map((si) => (
                            <div key={si.item.uuid} className="p-4 bg-black/40 border border-white/5 rounded flex items-center justify-between group">
                                <div className="flex items-center space-x-4">
                                    <div className="h-10 w-10 bg-sc-dark border border-white/5 rounded flex items-center justify-center text-sc-grey/40 group-hover:text-sc-blue transition-colors">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-white uppercase tracking-widest">{si.item.name}</div>
                                        <div className="text-[8px] text-sc-grey/40 uppercase font-mono">{si.item.category}</div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-6">
                                    <div className="flex items-center space-x-3">
                                        <button onClick={() => updateQuantity(si.item.uuid, -1)} className="p-1 hover:bg-white/5 rounded text-sc-grey/40"><Minus className="w-3 h-3" /></button>
                                        <span className="text-xs font-bold text-sc-blue font-mono w-4 text-center">{si.quantity}</span>
                                        <button onClick={() => updateQuantity(si.item.uuid, 1)} className="p-1 hover:bg-white/5 rounded text-sc-grey/40"><Plus className="w-3 h-3" /></button>
                                    </div>
                                    <button onClick={() => removeItem(si.item.uuid)} className="p-2 hover:bg-red-500/10 rounded text-sc-grey/20 hover:text-red-400 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
