'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Shield, 
  ChevronRight, 
  Plus,
  Clock,
  MapPin,
  Users,
  X,
  Calendar,
  Rocket,
  Package
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function OperationsPage() {
  const queryClient = useQueryClient();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [newOp, setNewOp] = useState({
    title: '',
    description: '',
    type: 'Combat',
    scheduled_at: '',
    max_participants: 10,
    required_roles: '',
    required_ship_types: '',
    security_level: 'public',
    comms_frequency: '',
    intel_url: '',
  });

  const { data: operations, isLoading } = useQuery({
    queryKey: ['operations'],
    queryFn: async () => {
      const res = await api.get('/operations/');
      return res.data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    }
  });

  const authorizeMutation = useMutation({
    mutationFn: async () => {
      // Ensure date is in a format the backend expects if it's not already ISO
      const payload = {
        ...newOp,
        scheduled_at: newOp.scheduled_at 
      };
      return api.post('/operations/', payload);
    },
    onSuccess: () => {
      setShowAuthModal(false);
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      alert('Operation authorized. Signal broadcast to all tactical units.');
    },
    onError: (error: any) => {
      console.error('Authorization failure:', error);
      alert(error.response?.data || 'Signal interference detected. Operation authorization failed.');
    }
  });

  const formatDate = (dateString: string, part: 'month' | 'day' | 'time') => {
    const date = new Date(dateString);
    if (part === 'month') return date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
    if (part === 'day') return date.toLocaleDateString(undefined, { day: 'numeric' });
    if (part === 'time') return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return '';
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Operations Console
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Active Combat & Logistics Deployment
          </p>
        </div>
        {profile?.is_rsi_verified ? (
            <button 
                onClick={() => setShowAuthModal(true)}
                className="w-full md:w-auto px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center justify-center"
            >
                <Plus className="w-4 h-4 mr-2" />
                Authorize Operation
            </button>
        ) : (
            <div className="px-4 py-2 bg-sc-grey/5 border border-sc-grey/20 text-sc-grey/40 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center italic">
                <Shield className="w-3.5 h-3.5 mr-2 opacity-20" />
                Clearance Required
            </div>
        )}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="p-24 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Shield className="w-12 h-12 text-sc-blue opacity-20 animate-pulse" />
                <div className="absolute inset-0 border-2 border-sc-blue rounded-full animate-ping opacity-10"></div>
              </div>
              <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic font-mono">Scanning mission parameters...</span>
            </div>
          </div>
        ) : operations?.length > 0 ? (
          operations.map((op: any) => (
            <div 
              key={op.id} 
              className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden flex flex-col md:flex-row group hover:border-sc-blue/30 transition-all duration-300 shadow-xl"
            >
              {/* Date Badge */}
              <div className="flex md:flex-col items-center justify-center space-x-4 md:space-x-0 md:space-y-1 md:w-32 bg-sc-dark border-b md:border-b-0 md:border-r border-sc-grey/5 p-4 md:p-6 group-hover:bg-black/40 transition-colors">
                <span className="text-[10px] text-sc-blue font-black tracking-widest">{formatDate(op.scheduled_at, 'month')}</span>
                <span className="text-2xl md:text-4xl font-bold text-white leading-none">{formatDate(op.scheduled_at, 'day')}</span>
                <span className="text-[8px] text-sc-grey/30 font-mono uppercase">{formatDate(op.scheduled_at, 'time')}</span>
              </div>

              {/* Info Area */}
              <div className="flex-1 p-4 md:p-6 flex flex-col justify-center min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="px-2 py-0.5 bg-sc-blue/5 border border-sc-blue/20 rounded text-[9px] font-black uppercase text-sc-blue tracking-widest">
                    {op.type}
                  </span>
                  <div className="flex items-center text-[10px] text-sc-grey/40 font-bold uppercase tracking-widest">
                    <Clock className="w-3 h-3 mr-1.5 opacity-50" />
                    <span className="hidden sm:inline">Status:</span> <span className="text-sc-grey/80 ml-1">{op.status}</span>
                  </div>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-tight truncate mb-2 italic">
                  {op.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-sc-grey/40 font-black uppercase tracking-widest">
                  <span className="flex items-center">
                    <Users className="w-3 h-3 mr-1.5 text-sc-blue/50" />
                    {op.participants?.length || 0} / {op.max_participants || '∞'} Crew
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1.5 text-sc-blue/50" />
                    Stanton Sector
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 md:p-6 bg-black/20 md:w-48 flex items-center justify-center">
                <Link 
                  href={`/operations/mission?id=${op.id}`}
                  className="w-full py-2.5 border border-sc-blue/30 text-sc-blue text-[10px] font-black uppercase tracking-[0.2em] rounded text-center hover:bg-sc-blue hover:text-sc-dark transition-all duration-300 shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.05)]"
                >
                  Mission Intel
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-sc-panel border border-sc-grey/10 p-24 text-center rounded">
            <p className="text-sc-grey/30 uppercase tracking-[0.3em] text-sm italic">All sectors currently dark. No active operations.</p>
          </div>
        )}
      </div>

      {/* Operation Authorization Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-xl">
            <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-2xl shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-sc-blue" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">New Operation Authorization</h3>
                    </div>
                    <button onClick={() => setShowAuthModal(false)} className="text-sc-grey/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Mission Details */}
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Mission Title</label>
                            <input 
                                value={newOp.title}
                                onChange={(e) => setNewOp({...newOp, title: e.target.value})}
                                placeholder="Operation Name..."
                                className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Deployment Time</label>
                            <input 
                                type="datetime-local"
                                value={newOp.scheduled_at}
                                onChange={(e) => setNewOp({...newOp, scheduled_at: e.target.value})}
                                className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none font-mono"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Operation Type</label>
                            <select 
                                value={newOp.type}
                                onChange={(e) => setNewOp({...newOp, type: e.target.value})}
                                className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none appearance-none"
                            >
                                <option value="Combat">Combat</option>
                                <option value="Logistics">Logistics</option>
                                <option value="Training">Training</option>
                                <option value="Social">Social</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Security Classification</label>
                            <select 
                                value={newOp.security_level}
                                onChange={(e) => setNewOp({...newOp, security_level: e.target.value})}
                                className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none appearance-none font-bold uppercase"
                            >
                                <option value="public">Public (Open to All)</option>
                                <option value="internal">Internal (Org Only)</option>
                                <option value="restricted">Restricted (Staff Only)</option>
                                <option value="classified">Classified (Need to Know)</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Primary Comms Frequency</label>
                            <input 
                                value={newOp.comms_frequency}
                                onChange={(e) => setNewOp({...newOp, comms_frequency: e.target.value})}
                                placeholder="e.g. 124.5 MHz or Discord Link"
                                className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Tactical Intel URL</label>
                            <input 
                                value={newOp.intel_url}
                                onChange={(e) => setNewOp({...newOp, intel_url: e.target.value})}
                                placeholder="Link to briefing docs/maps..."
                                className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Briefing Description</label>
                            <textarea 
                                value={newOp.description}
                                onChange={(e) => setNewOp({...newOp, description: e.target.value})}
                                rows={4}
                                placeholder="Classified mission parameters..."
                                className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none resize-none"
                            />
                        </div>
                    </div>

                    {/* Requirements */}
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Requested Roles</label>
                            <input 
                                value={newOp.required_roles}
                                onChange={(e) => setNewOp({...newOp, required_roles: e.target.value})}
                                placeholder="e.g. Pilot, Medical, Security..."
                                className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none font-bold uppercase tracking-widest"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Requested Vessels</label>
                            <input 
                                value={newOp.required_ship_types}
                                onChange={(e) => setNewOp({...newOp, required_ship_types: e.target.value})}
                                placeholder="e.g. Carrack, Gladius, Cutlass Red..."
                                className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none font-bold uppercase tracking-widest"
                            />
                        </div>
                        <div className="p-4 bg-sc-blue/5 border border-sc-blue/10 rounded flex items-start space-x-3">
                            <Package className="w-4 h-4 text-sc-blue mt-0.5" />
                            <p className="text-[9px] text-sc-grey/60 uppercase leading-relaxed font-bold tracking-widest">
                                Requested assets and roles will be displayed to all tactical units viewing this intel.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end space-x-4">
                    <button 
                        onClick={() => setShowAuthModal(false)}
                        className="px-6 py-2 text-[10px] font-black text-sc-grey/40 hover:text-white uppercase tracking-widest"
                    >
                        Abort
                    </button>
                    <button 
                        onClick={() => authorizeMutation.mutate()}
                        disabled={authorizeMutation.isPending || !newOp.title || !newOp.scheduled_at}
                        className="px-8 py-2 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all disabled:opacity-20"
                    >
                        {authorizeMutation.isPending ? 'Broadcasting...' : 'Authorize Operation'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
