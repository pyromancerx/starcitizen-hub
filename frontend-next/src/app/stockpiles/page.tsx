'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Database, 
  ChevronRight, 
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Box,
  Clock,
  User as UserIcon
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function StockpilesPage() {
  const { data: stockpiles, isLoading } = useQuery({
    queryKey: ['stockpiles'],
    queryFn: async () => {
      const res = await api.get('/stockpiles/');
      return res.data;
    },
  });

  const { data: loans } = useQuery({
    queryKey: ['asset-loans'],
    queryFn: async () => {
      const res = await api.get('/stockpiles/loans');
      return res.data;
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Organization Stockpiles
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Shared Strategic Resource Reserves
          </p>
        </div>
        <button className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center">
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
                  <button className="flex-1 py-2 bg-sc-blue/5 hover:bg-sc-blue/10 border border-sc-blue/20 rounded text-[9px] font-black uppercase text-sc-blue tracking-widest transition-all flex items-center justify-center">
                    <ArrowUpRight className="w-3 h-3 mr-1" /> Deposit
                  </button>
                  <button className="flex-1 py-2 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded text-[9px] font-black uppercase text-red-400 tracking-widest transition-all flex items-center justify-center">
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
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-black/40 border-b border-sc-grey/10">
                            <tr>
                                <th className="px-6 py-3 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Insignia / Item</th>
                                <th className="px-6 py-3 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Citizen</th>
                                <th className="px-6 py-3 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Quantity</th>
                                <th className="px-6 py-3 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Deployment Date</th>
                                <th className="px-6 py-3 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Due Return</th>
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
                                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">{loan.stockpile?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <UserIcon className="w-3 h-3 text-sc-grey/40" />
                                            <span className="text-[10px] text-sc-grey/60 font-bold uppercase">{loan.user?.display_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-[10px] font-mono text-sc-blue font-bold">{loan.quantity} {loan.stockpile?.unit}</td>
                                    <td className="px-6 py-4 text-[10px] text-sc-grey/40 font-mono">{new Date(loan.loaned_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
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
    </div>
  );
}
