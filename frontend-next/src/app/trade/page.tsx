'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  TrendingUp, 
  ChevronRight, 
  Plus,
  Navigation,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function TradePage() {
  const { data: runs, isLoading } = useQuery({
    queryKey: ['trade-runs'],
    queryFn: async () => {
      const res = await api.get('/trade/runs'); // This endpoint might need to be verified in Go
      return res.data;
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
          <button className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center">
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
    </div>
  );
}
