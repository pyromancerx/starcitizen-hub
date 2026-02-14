'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  MessageSquare, 
  ChevronRight, 
  Plus,
  Radio,
  MessageCircle,
  Lock,
  Globe,
  History,
  X
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ForumPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name: '',
    description: '',
    is_private: false
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['forum-categories'],
    queryFn: async () => {
      const res = await api.get('/forum/categories');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post('/forum/categories', newChannel);
    },
    onSuccess: () => {
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ['forum-categories'] });
      alert('Communication frequency established.');
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Forum Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-sc-panel border border-sc-blue/20 p-8 rounded-lg relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-5">
            <MessageSquare className="w-48 h-48 text-sc-blue" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Spectrum Relay</h2>
          <p className="text-[10px] text-sc-blue font-mono uppercase tracking-[0.2em]">Institutional Communication Network • Stanton Sector</p>
        </div>
        <div className="flex items-center space-x-3 relative z-10">
            <button 
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-black uppercase rounded hover:bg-sc-blue hover:text-sc-dark transition-all flex items-center space-x-2"
            >
                <Plus className="w-4 h-4" />
                <span>Establish Channel</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="p-24 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Radio className="w-12 h-12 text-sc-blue opacity-20 animate-pulse" />
              <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic font-mono">Synchronizing Spectrum Frequencies...</span>
            </div>
          </div>
        ) : categories?.map((cat: any) => (
          <Link 
            key={cat.id} 
            href={`/forum/channel?id=${cat.id}`}
            className="bg-sc-panel border border-white/5 rounded-lg overflow-hidden flex group hover:border-sc-blue/30 transition-all duration-300 shadow-xl"
          >
            {/* Icon/Color Side */}
            <div className="w-20 bg-sc-dark border-r border-sc-grey/5 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                <div className="p-3 bg-sc-blue/5 border border-sc-blue/20 rounded-full text-sc-blue/40 group-hover:text-sc-blue group-hover:bg-sc-blue/10 transition-all">
                    <MessageCircle className="w-6 h-6" />
                </div>
            </div>

            {/* Info Area */}
            <div className="flex-1 p-6 flex flex-col justify-center min-w-0">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="text-lg font-black text-white uppercase tracking-widest group-hover:text-sc-blue transition-colors truncate">
                  {cat.name}
                </h3>
                {cat.is_private ? (
                    <Lock className="w-3.5 h-3.5 text-sc-grey/40" />
                ) : (
                    <Globe className="w-3.5 h-3.5 text-sc-grey/40" />
                )}
              </div>
              <p className="text-[11px] text-sc-grey/60 uppercase font-bold tracking-tight line-clamp-1">
                {cat.description || 'Standard institutional discussion frequency.'}
              </p>
            </div>

            {/* Stats Area */}
            <div className="hidden md:flex items-center px-8 space-x-8 bg-black/20">
                <div className="text-center w-16">
                    <div className="text-[10px] font-bold text-white font-mono">{cat.threads?.length || 0}</div>
                    <div className="text-[7px] font-black text-sc-grey/40 uppercase tracking-tighter">Topics</div>
                </div>
                <div className="text-center w-16">
                    <div className="text-[10px] font-bold text-white font-mono">142</div>
                    <div className="text-[7px] font-black text-sc-grey/40 uppercase tracking-tighter">Transmissions</div>
                </div>
                <ChevronRight className="w-5 h-5 text-sc-grey/20 group-hover:text-sc-blue group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      {/* Forum Rules/Status Bar */}
      <div className="p-6 bg-sc-blue/5 border border-sc-blue/10 rounded flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <History className="w-4 h-4 text-sc-blue/40" />
            <span className="text-[9px] font-black text-sc-grey/40 uppercase tracking-widest leading-relaxed">
                All transmissions are recorded and archived. Follow standard organization comms protocols.
            </span>
        </div>
        <span className="text-[8px] font-mono text-sc-blue/40 uppercase">Latency: 14ms • Stanton-Net</span>
      </div>

      {/* Establish Channel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-md">
            <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-md shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Radio className="w-5 h-5 text-sc-blue" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Establish Communication Frequency</h3>
                    </div>
                    <button onClick={() => setShowAddModal(false)} className="text-sc-grey hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Frequency Designation (Name)</label>
                        <input 
                            value={newChannel.name}
                            onChange={(e) => setNewChannel({...newChannel, name: e.target.value})}
                            placeholder="e.g. Tactical Intel"
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Broadcast Parameters (Description)</label>
                        <textarea 
                            value={newChannel.description}
                            onChange={(e) => setNewChannel({...newChannel, description: e.target.value})}
                            rows={3}
                            placeholder="Primary purpose of this frequency..."
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none resize-none"
                        />
                    </div>
                    <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-3 cursor-pointer group">
                            <div className={cn(
                                "w-4 h-4 border transition-all flex items-center justify-center rounded-sm",
                                newChannel.is_private ? "bg-sc-blue border-sc-blue" : "border-white/10 bg-black/40"
                            )}>
                                {newChannel.is_private && <Lock className="w-3 h-3 text-sc-dark" />}
                                <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={newChannel.is_private}
                                    onChange={(e) => setNewChannel({...newChannel, is_private: e.target.checked})}
                                />
                            </div>
                            <span className="text-[10px] font-black text-sc-grey/60 uppercase group-hover:text-white transition-colors">Restrict to high-clearance personnel</span>
                        </label>
                    </div>
                </div>

                <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end space-x-4">
                    <button 
                        onClick={() => setShowAddModal(false)}
                        className="px-6 py-2 text-[10px] font-black text-sc-grey/40 hover:text-white uppercase tracking-widest"
                    >
                        Abort
                    </button>
                    <button 
                        onClick={() => createMutation.mutate()}
                        disabled={createMutation.isPending || !newChannel.name}
                        className="px-8 py-2 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all disabled:opacity-20"
                    >
                        {createMutation.isPending ? 'Establishing...' : 'Initialize Link'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
