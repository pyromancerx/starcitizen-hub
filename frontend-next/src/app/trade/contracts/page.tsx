'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  FileText, 
  ChevronRight, 
  Plus,
  MapPin,
  Clock,
  Briefcase,
  X
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ContractsPage() {
  const queryClient = useQueryClient();
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [newContract, setNewContract] = useState({
    commodity: '',
    quantity: 0,
    payment_amount: 0,
    origin_location: '',
    destination_location: '',
    deadline: ''
  });

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['cargo-contracts'],
    queryFn: async () => {
      const res = await api.get('/trade/contracts');
      return res.data;
    },
  });

  const issueMutation = useMutation({
    mutationFn: async () => {
      return api.post('/trade/contracts', newContract); // Note: Verify POST /trade/contracts in Go
    },
    onSuccess: () => {
      setShowIssueModal(false);
      queryClient.invalidateQueries({ queryKey: ['cargo-contracts'] });
      alert('Logistics contract broadcast to all commercial units.');
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.post(`/trade/contracts/${id}/accept`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargo-contracts'] });
      alert('Contract authorized and transferred to your mission log.');
    },
    onError: (err: any) => {
      alert('Failed to accept contract: ' + (err.response?.data || err.message));
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Commercial Contracts
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Encrypted Logistics Exchange
          </p>
        </div>
        <button 
            onClick={() => setShowIssueModal(true)}
            className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Issue Contract
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full p-24 text-center">
            <div className="flex flex-col items-center space-y-4">
              <FileText className="w-12 h-12 text-sc-blue opacity-20 animate-pulse" />
              <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic font-mono">Scanning contract board...</span>
            </div>
          </div>
        ) : contracts?.length > 0 ? (
          contracts.map((contract: any) => (
            <div 
              key={contract.id} 
              className="bg-sc-panel border border-sc-grey/10 rounded-lg p-6 group hover:border-sc-blue/30 transition-all duration-300 relative overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "px-2 py-0.5 border rounded text-[8px] font-black uppercase tracking-widest",
                      contract.status === 'open' ? "bg-sc-blue/5 border-sc-blue/20 text-sc-blue" : "bg-sc-grey/5 border-sc-grey/20 text-sc-grey/40"
                    )}>
                      {contract.status}
                    </span>
                    <span className="text-[10px] text-sc-grey/30 font-mono">REF: CT-{contract.id.toString().padStart(4, '0')}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">{contract.commodity}</h3>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-sc-blue font-mono">{contract.payment_amount.toLocaleString()} aUEC</div>
                  <div className="text-[8px] text-sc-grey/30 uppercase font-black">Escrow Guaranteed</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest block">Pickup</span>
                  <span className="text-xs text-white uppercase font-bold flex items-center">
                    <MapPin className="w-3 h-3 mr-1 text-sc-blue/40" />
                    {contract.origin_location}
                  </span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest block">Delivery</span>
                  <span className="text-xs text-white uppercase font-bold flex items-center justify-end">
                    {contract.destination_location}
                    <MapPin className="w-3 h-3 ml-1 text-sc-blue/40" />
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-sc-grey/5 flex justify-between items-center">
                <div className="flex items-center text-[10px] text-sc-grey/40 font-bold uppercase tracking-widest">
                  <Clock className="w-3 h-3 mr-1.5 opacity-50" />
                  Deadline: {contract.deadline ? new Date(contract.deadline).toLocaleDateString() : 'N/A'}
                </div>
                <button 
                  onClick={() => acceptMutation.mutate(contract.id)}
                  disabled={contract.status !== 'open' || acceptMutation.isPending}
                  className="px-6 py-2 bg-sc-blue/5 hover:bg-sc-blue/10 border border-sc-blue/20 rounded text-[9px] font-black uppercase text-sc-blue tracking-widest transition-all disabled:opacity-20"
                >
                  {contract.status === 'open' ? 'Accept Contract' : 'Assigned'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-sc-panel border border-sc-grey/10 p-24 text-center rounded">
            <p className="text-sc-grey/30 uppercase tracking-[0.3em] text-sm italic">No contracts currently posted in your sector.</p>
          </div>
        )}
      </div>

      {/* Issue Contract Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-md">
            <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-xl shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Briefcase className="w-5 h-5 text-sc-blue" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Logistics Contract Authorization</h3>
                    </div>
                    <button onClick={() => setShowIssueModal(false)} className="text-sc-grey/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Commodity / Asset</label>
                        <input 
                            value={newContract.commodity}
                            onChange={(e) => setNewContract({...newContract, commodity: e.target.value})}
                            placeholder="e.g. Iron, RMC, Supplies"
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Contract Yield (aUEC)</label>
                        <input 
                            type="number"
                            value={newContract.payment_amount}
                            onChange={(e) => setNewContract({...newContract, payment_amount: Number(e.target.value)})}
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none font-mono"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Pickup Node (Origin)</label>
                        <input 
                            value={newContract.origin_location}
                            onChange={(e) => setNewContract({...newContract, origin_location: e.target.value})}
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Delivery Node (Destination)</label>
                        <input 
                            value={newContract.destination_location}
                            onChange={(e) => setNewContract({...newContract, destination_location: e.target.value})}
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Deployment Deadline</label>
                        <input 
                            type="date"
                            value={newContract.deadline}
                            onChange={(e) => setNewContract({...newContract, deadline: e.target.value})}
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none font-mono"
                        />
                    </div>
                </div>

                <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end space-x-4">
                    <button 
                        onClick={() => setShowIssueModal(false)}
                        className="px-6 py-2 text-[10px] font-black text-sc-grey/40 hover:text-white uppercase tracking-widest"
                    >
                        Abort
                    </button>
                    <button 
                        onClick={() => issueMutation.mutate()}
                        disabled={issueMutation.isPending || !newContract.commodity || !newContract.origin_location}
                        className="px-8 py-2 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all disabled:opacity-20"
                    >
                        {issueMutation.isPending ? 'Broadcasting...' : 'Authorize Contract'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
