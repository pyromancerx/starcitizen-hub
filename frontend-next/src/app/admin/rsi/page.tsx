'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  ShieldCheck, 
  User as UserIcon, 
  Clock, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  FileSearch,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminRSIVerificationPage() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-rsi-requests'],
    queryFn: async () => {
      const res = await api.get('/admin/rsi-requests?status=pending');
      return res.data;
    },
  });

  const processMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      return api.post(`/admin/rsi-requests/${id}/process`, { status, notes: 'Command verified.' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rsi-requests'] });
      alert('Identity match authorization complete.');
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Identity Authorization
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            RSI Citizen Matching & Verification Queue
          </p>
        </div>
        <div className="flex items-center space-x-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sc-grey/40" />
                <input 
                    placeholder="Query Signal..."
                    className="bg-sc-dark/50 border border-sc-grey/10 rounded pl-9 pr-4 py-2 text-[10px] text-white focus:outline-none focus:border-sc-blue/50 uppercase tracking-widest font-bold w-64"
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="p-24 text-center">
            <FileSearch className="w-12 h-12 text-sc-blue opacity-20 animate-pulse mx-auto mb-4" />
            <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic font-mono">Scanning authorization queue...</span>
          </div>
        ) : requests?.length > 0 ? (
          requests.map((req: any) => (
            <div key={req.id} className="bg-sc-panel border border-white/5 rounded-lg overflow-hidden flex group hover:border-sc-blue/30 transition-all duration-300 shadow-xl">
              <div className="w-1.5 bg-yellow-500 animate-pulse"></div>
              <div className="p-6 flex-1 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center space-x-6">
                    <div className="h-16 w-16 rounded bg-sc-dark border border-white/5 flex items-center justify-center text-sc-blue/40">
                        <UserIcon className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <div className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Citizen Designation</div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight italic">{req.user?.display_name || 'REDACTED'}</h3>
                        <div className="text-[10px] text-sc-blue font-bold uppercase tracking-widest">Requested Handle: {req.rsi_handle}</div>
                    </div>
                </div>

                <div className="flex-1 max-w-sm">
                    <div className="p-3 bg-black/40 border border-white/5 rounded text-[9px] text-sc-grey/60 uppercase leading-relaxed font-bold">
                        Verification signal submitted via manual upload. Cross-reference RSI handle before authorizing institutional link.
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button 
                        onClick={() => processMutation.mutate({ id: req.id, status: 'approved' })}
                        disabled={processMutation.isPending}
                        className="px-6 py-2 bg-green-500/10 border border-green-500/30 text-green-500 text-[10px] font-black rounded uppercase hover:bg-green-500 hover:text-white transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)] flex items-center space-x-2"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Authorize</span>
                    </button>
                    <button 
                        onClick={() => processMutation.mutate({ id: req.id, status: 'rejected' })}
                        disabled={processMutation.isPending}
                        className="px-6 py-2 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black rounded uppercase hover:bg-red-500 hover:text-white transition-all flex items-center space-x-2"
                    >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Refuse</span>
                    </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-sc-panel border border-sc-grey/10 p-24 text-center rounded-lg opacity-40">
            <p className="text-xs font-black uppercase tracking-[0.3em] italic">No pending identity signals detected.</p>
          </div>
        )}
      </div>
    </div>
  );
}
