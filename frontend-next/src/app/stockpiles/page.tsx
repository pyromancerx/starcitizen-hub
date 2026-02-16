'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Database, 
  ChevronRight, 
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Box,
  Clock,
  User as UserIcon,
  X
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function StockpilesPage() {
  const queryClient = useQueryClient();
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<'deposit' | 'requisition'>('deposit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const [newStockpile, setNewStockpile] = useState({
    name: '',
    description: '',
    resource_type: 'Supplies',
    unit: 'Units',
    min_threshold: 0
  });

  const { data: stockpiles, isLoading } = useQuery({
    queryKey: ['stockpiles'],
    queryFn: async () => {
      const res = await api.get('/stockpiles/');
      return res.data;
    },
  });

  const provisionMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/stockpiles/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockpiles'] });
      setShowProvisionModal(false);
      setNewStockpile({ name: '', description: '', resource_type: 'Supplies', unit: 'Units', min_threshold: 0 });
    }
  });

  const transactionMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/stockpiles/transactions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockpiles'] });
      queryClient.invalidateQueries({ queryKey: ['asset-loans'] });
      setShowTransactionModal(null);
      setAmount('');
      setReason('');
    }
  });

  const handleTransaction = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    transactionMutation.mutate({
      stockpile_id: showTransactionModal.id,
      quantity_change: transactionType === 'deposit' ? val : -val,
      transaction_type: transactionType,
      reason: reason || `Manual ${transactionType}`
    });
  };

  const { data: loans } = useQuery({
    queryKey: ['asset-loans'],
    queryFn: async () => {
      const res = await api.get('/stockpiles/loans');
      return res.data;
    },
  });

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Organization Stockpiles
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Shared Strategic Resource Reserves
          </p>
        </div>
        <button 
          onClick={() => setShowProvisionModal(true)}
          className="w-full md:w-auto px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center justify-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Provision Stockpile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full p-24 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Database className="w-12 h-12 text-sc-blue opacity-20 animate-spin" />
              <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic font-mono">Inventory Scanning in progress...</span>
            </div>
          </div>
        ) : stockpiles?.length > 0 ? (
          stockpiles.map((stock: any) => (
            <div 
              key={stock.id} 
              className="bg-sc-panel border border-sc-grey/10 rounded-lg p-6 group hover:border-sc-blue/30 transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <div className="text-[8px] font-black uppercase text-sc-blue tracking-widest bg-sc-blue/5 border border-sc-blue/20 px-2 py-0.5 rounded-full inline-block">
                    {stock.resource_type}
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">{stock.name}</h3>
                </div>
                <Box className="w-8 h-8 text-sc-grey/10 group-hover:text-sc-blue/20 transition-colors" />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest block">Available Quantity</span>
                    <div className="text-3xl font-mono font-bold text-white leading-none">
                      {stock.quantity.toLocaleString()} <span className="text-sm text-sc-blue font-bold">{stock.unit}</span>
                    </div>
                  </div>
                  {stock.min_threshold && (
                    <div className="text-right">
                      <span className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest block">Alert Threshold</span>
                      <span className="text-[10px] text-yellow-500 font-bold font-mono">{stock.min_threshold}</span>
                    </div>
                  )}
                </div>

                <div className="w-full bg-sc-dark h-1.5 rounded-full overflow-hidden border border-sc-grey/10">
                  <div 
                    className={cn(
                      "h-full shadow-[0_0_8px] transition-all duration-1000",
                      stock.quantity <= (stock.min_threshold || 0) ? "bg-red-500 shadow-red-500" : "bg-sc-blue shadow-[#66fcf1]"
                    )}
                    style={{ width: `${Math.min(100, (stock.quantity / ((stock.min_threshold || 1) * 2)) * 100)}%` }}
                  ></div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => { setShowTransactionModal(stock); setTransactionType('deposit'); }}
                    className="flex-1 py-2 bg-sc-blue/5 hover:bg-sc-blue/10 border border-sc-blue/20 rounded text-[9px] font-black uppercase text-sc-blue tracking-widest transition-all flex items-center justify-center"
                  >
                    <ArrowUpRight className="w-3 h-3 mr-1" /> Deposit
                  </button>
                  <button 
                    onClick={() => { setShowTransactionModal(stock); setTransactionType('requisition'); }}
                    className="flex-1 py-2 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded text-[9px] font-black uppercase text-red-400 tracking-widest transition-all flex items-center justify-center"
                  >
                    <ArrowDownLeft className="w-3 h-3 mr-1" /> Requisition
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-sc-panel border border-sc-grey/10 p-24 text-center rounded">
            <p className="text-sc-grey/30 uppercase tracking-[0.3em] text-sm italic">Supply depots are currently empty.</p>
          </div>
        )}
      </div>

      {/* Asset Loaning Section */}
      {loans && (
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-sc-blue" />
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Active Strategic Asset Loans</h3>
            </div>
            
            <div className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-black/40 border-b border-sc-grey/10">
                            <tr>
                                <th className="px-6 py-3 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Insignia / Item</th>
                                <th className="px-6 py-3 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Citizen</th>
                                <th className="px-6 py-3 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Quantity</th>
                                <th className="px-6 py-3 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Deployment Date</th>
                                <th className="px-6 py-3 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest whitespace-nowrap">Due Return</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loans.map((loan: any) => (
                                <tr key={loan.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-8 w-8 bg-sc-dark border border-sc-blue/20 rounded flex items-center justify-center text-sc-blue">
                                                <Box className="w-4 h-4" />
                                            </div>
                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest whitespace-nowrap">{loan.stockpile?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <UserIcon className="w-3 h-3 text-sc-grey/40" />
                                            <span className="text-[10px] text-sc-grey/60 font-bold uppercase whitespace-nowrap">{loan.user?.display_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[10px] font-mono text-sc-blue font-bold whitespace-nowrap">{loan.quantity} {loan.stockpile?.unit}</td>
                                    <td className="px-6 py-4 text-[10px] text-sc-grey/40 font-mono whitespace-nowrap">{new Date(loan.loaned_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-[10px] text-yellow-500 font-black uppercase tracking-tighter">
                                            {loan.due_at ? new Date(loan.due_at).toLocaleDateString() : 'MISSION END'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {loans.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sc-grey/20 uppercase tracking-[0.3em] font-black italic">
                                        All strategic assets currently secured in stockpiles.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* Provision Stockpile Modal */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-md">
            <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-md shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Plus className="w-5 h-5 text-sc-blue" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Provision Strategic Reserve</h3>
                    </div>
                    <button onClick={() => setShowProvisionModal(false)} className="text-sc-grey/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        provisionMutation.mutate(newStockpile);
                    }}
                    className="p-8 space-y-6"
                >
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Reserve Name</label>
                        <input 
                            required
                            value={newStockpile.name}
                            onChange={(e) => setNewStockpile({...newStockpile, name: e.target.value})}
                            placeholder="e.g. Alpha-1 Fuel Cell..."
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Resource Type</label>
                            <input 
                                value={newStockpile.resource_type}
                                onChange={(e) => setNewStockpile({...newStockpile, resource_type: e.target.value})}
                                placeholder="e.g. Fuel, Munitions..."
                                className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Unit of Measure</label>
                            <input 
                                value={newStockpile.unit}
                                onChange={(e) => setNewStockpile({...newStockpile, unit: e.target.value})}
                                placeholder="e.g. Units, Liters, KG..."
                                className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Minimum Alert Threshold</label>
                        <input 
                            type="number"
                            value={newStockpile.min_threshold}
                            onChange={(e) => setNewStockpile({...newStockpile, min_threshold: parseFloat(e.target.value)})}
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none font-mono"
                        />
                    </div>

                    <div className="pt-4 border-t border-white/5 flex justify-end space-x-4">
                        <button 
                            type="button"
                            onClick={() => setShowProvisionModal(false)}
                            className="px-6 py-2 text-[10px] font-black text-sc-grey/40 hover:text-white uppercase tracking-widest"
                        >
                            Abort
                        </button>
                        <button 
                            type="submit"
                            disabled={provisionMutation.isPending || !newStockpile.name}
                            className="px-8 py-2 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all disabled:opacity-20"
                        >
                            {provisionMutation.isPending ? 'Syncing...' : 'Provision Reserve'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Transaction Modal (Deposit/Requisition) */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-md">
            <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-sm shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        {transactionType === 'deposit' ? <ArrowUpRight className="w-5 h-5 text-sc-blue" /> : <ArrowDownLeft className="w-5 h-5 text-red-400" />}
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">{transactionType === 'deposit' ? 'Resource Induction' : 'Resource Requisition'}</h3>
                    </div>
                    <button onClick={() => setShowTransactionModal(null)} className="text-sc-grey/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-sc-blue uppercase tracking-widest">Strategic Asset</label>
                        <div className="text-lg font-bold text-white italic tracking-tight uppercase">{showTransactionModal.name}</div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Quantity ({showTransactionModal.unit})</label>
                        <input 
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none font-mono"
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Manifest Note / Reason</label>
                        <input 
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Refuel after Op X, Logistics run..."
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                        />
                    </div>

                    <div className="flex space-x-3 pt-2">
                        <button 
                            onClick={() => setShowTransactionModal(null)}
                            className="flex-1 py-2 border border-white/10 text-sc-grey text-[10px] font-black uppercase rounded hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleTransaction}
                            disabled={transactionMutation.isPending || !amount}
                            className={cn(
                                "flex-1 py-2 text-[10px] font-black uppercase rounded transition-all",
                                transactionType === 'deposit' ? "bg-sc-blue text-sc-dark" : "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                            )}
                        >
                            {transactionMutation.isPending ? 'Syncing...' : 'Authorize'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
