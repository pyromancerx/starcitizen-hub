'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Globe, 
  ShieldAlert, 
  Swords, 
  Heart, 
  Info, 
  Search, 
  Filter, 
  Plus,
  ExternalLink,
  Zap,
  Target,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function FederationPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegModal, setShowRegModal] = useState(false);
  const [newEntity, setNewEntity] = useState({
    name: '',
    sid: '',
    status: 'neutral',
    description: '',
    tactical_notes: ''
  });

  const { data: entities, isLoading } = useQuery({
    queryKey: ['federation-entities'],
    queryFn: async () => {
      const res = await api.get('/social/federation');
      return res.data;
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      return api.post('/social/federation', newEntity);
    },
    onSuccess: () => {
      setShowRegModal(false);
      queryClient.invalidateQueries({ queryKey: ['federation-entities'] });
      alert('External entity successfully registered in intelligence bank.');
    },
  });

  const filteredEntities = entities?.filter((e: any) => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.sid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-sc-panel border border-sc-blue/20 p-8 rounded-lg relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-5">
            <Globe className="w-48 h-48 text-sc-blue" />
        </div>
        <div className="relative z-10 space-y-1">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Diplomatic Intelligence Bank</h2>
          <p className="text-[10px] text-sc-blue font-mono uppercase tracking-[0.2em]">Inter-Organizational Federation Records • Stanton Sector</p>
        </div>
        <div className="flex items-center space-x-3 relative z-10">
            <button 
                onClick={() => setShowRegModal(true)}
                className="px-6 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-black uppercase rounded hover:bg-sc-blue hover:text-sc-dark transition-all flex items-center space-x-2 shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.1)]"
            >
                <Plus className="w-4 h-4" />
                <span>Register Entity</span>
            </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex justify-between items-center bg-black/20 p-4 rounded border border-white/5">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sc-grey/40" />
            <input 
                placeholder="Query Org SID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-sc-dark/50 border border-sc-grey/10 rounded pl-9 pr-4 py-2 text-[10px] text-white focus:outline-none focus:border-sc-blue/50 uppercase tracking-widest font-bold w-64"
            />
        </div>
        <div className="flex items-center space-x-4">
            <StatusLegend label="Allied" color="text-green-500" />
            <StatusLegend label="Hostile" color="text-red-500" />
            <StatusLegend label="Neutral" color="text-sc-grey/40" />
        </div>
      </div>

      {/* Registry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full p-24 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Globe className="w-12 h-12 text-sc-blue opacity-20 animate-spin" />
              <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic font-mono">Syncing Galactic Records...</span>
            </div>
          </div>
        ) : filteredEntities?.map((entity: any) => (
          <OrgCard key={entity.id} entity={entity} />
        ))}

        {filteredEntities?.length === 0 && !isLoading && (
            <div className="col-span-full p-24 text-center bg-sc-panel border border-dashed border-white/5 rounded-lg opacity-40">
                <p className="text-xs font-black uppercase tracking-[0.3em]">No organizational signals detected matching current query.</p>
            </div>
        )}
      </div>

      {/* Federation Registration Modal */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-xl">
            <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-xl shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-sc-blue" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Federation Entity Authorization</h3>
                    </div>
                    <button onClick={() => setShowRegModal(false)} className="text-sc-grey/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Organization Name</label>
                        <input 
                            value={newEntity.name}
                            onChange={(e) => setNewEntity({...newEntity, name: e.target.value})}
                            placeholder="e.g. Arccorp Security"
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Organization SID</label>
                        <input 
                            value={newEntity.sid}
                            onChange={(e) => setNewEntity({...newEntity, sid: e.target.value})}
                            placeholder="e.g. ARCCORP"
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none font-mono"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Diplomatic Standing</label>
                        <select 
                            value={newEntity.status}
                            onChange={(e) => setNewEntity({...newEntity, status: e.target.value})}
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none appearance-none"
                        >
                            <option value="allied">Allied (Strategic)</option>
                            <option value="friendly">Friendly</option>
                            <option value="neutral">Neutral</option>
                            <option value="rival">Rival</option>
                            <option value="hostile">Hostile (KOS)</option>
                        </select>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Tactical Intelligence Notes</label>
                        <textarea 
                            value={newEntity.tactical_notes}
                            onChange={(e) => setNewEntity({...newEntity, tactical_notes: e.target.value})}
                            rows={3}
                            placeholder="Observed assets, typical fleet composition..."
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end space-x-4">
                    <button 
                        onClick={() => setShowRegModal(false)}
                        className="px-6 py-2 text-[10px] font-black text-sc-grey/40 hover:text-white uppercase tracking-widest"
                    >
                        Abort
                    </button>
                    <button 
                        onClick={() => registerMutation.mutate()}
                        disabled={registerMutation.isPending || !newEntity.name || !newEntity.sid}
                        className="px-8 py-2 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all disabled:opacity-20"
                    >
                        {registerMutation.isPending ? 'Synchronizing...' : 'Register Entity'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

const OrgCard = ({ entity }: { entity: any }) => {
    const isHostile = entity.status === 'hostile' || entity.status === 'rival';
    const isAllied = entity.status === 'allied' || entity.status === 'friendly';

    return (
        <div className={cn(
            "bg-sc-panel border rounded-lg overflow-hidden group transition-all duration-500 shadow-xl relative",
            isHostile ? "border-red-500/20 hover:border-red-500/40" : 
            isAllied ? "border-green-500/20 hover:border-green-500/40" : 
            "border-sc-blue/10 hover:border-sc-blue/40"
        )}>
            <div className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                    <div className="h-16 w-16 rounded bg-sc-dark border border-white/5 flex items-center justify-center text-sc-grey/20 group-hover:text-sc-blue transition-colors relative">
                        {entity.logo_url ? (
                            <img src={entity.logo_url} className="max-h-full max-w-full object-contain p-2" alt="Logo" />
                        ) : (
                            <ShieldAlert className="w-8 h-8" />
                        )}
                    </div>
                    <div className="text-right space-y-1">
                        <div className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Diplomatic Tier</div>
                        <div className={cn(
                            "text-[10px] font-black uppercase tracking-tighter",
                            isHostile ? "text-red-500" : isAllied ? "text-green-500" : "text-sc-grey/40"
                        )}>
                            {entity.status}
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest truncate">
                        {entity.name}
                    </h3>
                    <div className="text-[9px] text-sc-blue font-bold uppercase tracking-widest">
                        SID: {entity.sid}
                    </div>
                </div>

                <p className="text-[10px] text-sc-grey/60 uppercase font-bold tracking-tighter leading-relaxed line-clamp-2 min-h-[30px]">
                    {entity.description || 'No public intelligence data available for this entity.'}
                </p>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {isHostile ? (
                            <Swords className="w-4 h-4 text-red-500/40" />
                        ) : isAllied ? (
                            <Heart className="w-4 h-4 text-green-500/40" />
                        ) : (
                            <Globe className="w-4 h-4 text-sc-grey/20" />
                        )}
                        <span className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">
                            {entity.last_encounter ? `Last Encounter: ${new Date(entity.last_encounter).toLocaleDateString()}` : 'No Recent Encounters'}
                        </span>
                    </div>
                    <button 
                        onClick={() => alert(`Accessing deep-space intelligence for ${entity.name}... [External Data Link Placeholder]`)}
                        className="text-[8px] font-black text-sc-blue/40 hover:text-sc-blue uppercase tracking-[0.2em] flex items-center"
                    >
                        INTEL <ExternalLink className="w-2.5 h-2.5 ml-1.5" />
                    </button>
                </div>
            </div>
            
            {/* Status Indicator Bar */}
            <div className={cn(
                "h-1 transition-all duration-500",
                isHostile ? "bg-red-500 opacity-40 group-hover:opacity-100" : 
                isAllied ? "bg-green-500 opacity-40 group-hover:opacity-100" : 
                "bg-sc-blue opacity-10 group-hover:opacity-100"
            )}></div>
        </div>
    );
};

const StatusLegend = ({ label, color }: { label: string, color: string }) => (
    <div className="flex items-center space-x-2">
        <div className={cn("w-1.5 h-1.5 rounded-full", color.replace('text', 'bg'))}></div>
        <span className={cn("text-[8px] font-black uppercase tracking-widest", color)}>{label}</span>
    </div>
);
