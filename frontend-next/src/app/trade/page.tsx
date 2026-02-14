'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  TrendingUp, 
  ChevronRight, 
  Plus,
  Navigation,
  ArrowRight,
  DollarSign,
  X,
  Rocket
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function TradePage() {
  const queryClient = useQueryClient();
  const [showLogModal, setShowLogModal] = useState(false);
  const [newRun, setNewRun] = useState({
    origin_location: '',
    destination_location: '',
    commodity: '',
    quantity: 0,
    profit: 0,
    notes: ''
  });

  const { data: runs, isLoading } = useQuery({
    queryKey: ['trade-runs'],
    queryFn: async () => {
      const res = await api.get('/trade/runs');
      return res.data;
    },
  });

  const logRunMutation = useMutation({
    mutationFn: async () => {
      return api.post('/trade/runs', newRun);
    },
    onSuccess: () => {
      setShowLogModal(false);
      queryClient.invalidateQueries({ queryKey: ['trade-runs'] });
      alert('Commercial flight log synchronized.');
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Commercial Flight Logs
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Trade Run History & Profit Tracking
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/trade/contracts" className="px-4 py-2 bg-sc-panel border border-sc-grey/20 text-sc-grey text-xs font-bold uppercase tracking-widest hover:text-white transition-all flex items-center">
            Cargo Contracts
          </Link>
          <button 
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Trade Run
          </button>
        </div>
      </div>

      <div className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-sc-grey/10">
              <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Flight Path</th>
              <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Manifest</th>
              <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest text-right">Yield (aUEC)</th>
              <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sc-grey/5">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-sc-grey/40 uppercase tracking-widest text-[10px] italic">
                  Accessing navigational logs...
                </td>
              </tr>
            ) : runs?.length > 0 ? (
              runs.map((run: any) => (
                <tr key={run.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded bg-sc-dark border border-sc-blue/10 text-sc-blue">
                        <Navigation className="w-4 h-4" />
                      </div>
                      <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-tight">
                        <span>{run.origin_location}</span>
                        <ArrowRight className="w-3 h-3 text-sc-blue/40" />
                        <span>{run.destination_location}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-sc-blue/80 uppercase">{run.commodity}</span>
                      <span className="text-[10px] text-sc-grey/40 font-mono">{run.quantity.toLocaleString()} Units</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={cn(
                        "text-sm font-bold font-mono",
                        run.profit >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {run.profit >= 0 ? '+' : ''}{run.profit.toLocaleString()}
                      </span>
                      <span className="text-[8px] text-sc-grey/30 uppercase font-black">Net Profit</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-[10px] text-sc-grey/50 font-mono uppercase italic">
                      {new Date(run.completed_at || run.created_at).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-24 text-center">
                  <div className="flex flex-col items-center opacity-30">
                    <TrendingUp className="w-12 h-12 mb-4" />
                    <p className="text-sm uppercase tracking-[0.3em] text-sc-grey italic">No commercial signals detected.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Log Trade Run Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-md">
            <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-xl shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Navigation className="w-5 h-5 text-sc-blue" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Commercial Flight Log Authorization</h3>
                    </div>
                    <button onClick={() => setShowLogModal(false)} className="text-sc-grey/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Origin Terminal</label>
                        <input 
                            value={newRun.origin_location}
                            onChange={(e) => setNewRun({...newRun, origin_location: e.target.value})}
                            placeholder="e.g. New Babbage"
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Destination Terminal</label>
                        <input 
                            value={newRun.destination_location}
                            onChange={(e) => setNewRun({...newRun, destination_location: e.target.value})}
                            placeholder="e.g. Area18"
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Commodity SKU</label>
                        <input 
                            value={newRun.commodity}
                            onChange={(e) => setNewRun({...newRun, commodity: e.target.value})}
                            placeholder="e.g. Gold"
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Net Yield (aUEC)</label>
                        <input 
                            type="number"
                            value={newRun.profit}
                            onChange={(e) => setNewRun({...newRun, profit: Number(e.target.value)})}
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none font-mono"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Navigational Notes</label>
                        <textarea 
                            value={newRun.notes}
                            onChange={(e) => setNewRun({...newRun, notes: e.target.value})}
                            rows={3}
                            placeholder="Encountered pirate activity at OM-1..."
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end space-x-4">
                    <button 
                        onClick={() => setShowLogModal(false)}
                        className="px-6 py-2 text-[10px] font-black text-sc-grey/40 hover:text-white uppercase tracking-widest"
                    >
                        Abort
                    </button>
                    <button 
                        onClick={() => logRunMutation.mutate()}
                        disabled={logRunMutation.isPending || !newRun.origin_location || !newRun.destination_location}
                        className="px-8 py-2 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all disabled:opacity-20"
                    >
                        {logRunMutation.isPending ? 'Synchronizing...' : 'Log Flight Data'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
