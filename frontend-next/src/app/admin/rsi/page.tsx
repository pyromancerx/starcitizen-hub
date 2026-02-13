'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  ShieldCheck, 
  XCircle, 
  CheckCircle2, 
  ExternalLink,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RSIAdminPage() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['rsi-requests'],
    queryFn: async () => {
      const res = await api.get('/admin/rsi-requests');
      return res.data;
    },
  });

  const processMutation = useMutation({
    mutationFn: async ({ id, status, notes }: any) => {
      return api.post(`/admin/rsi-requests/${id}/process`, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rsi-requests'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden">
        <div className="bg-black/40 p-4 border-b border-sc-grey/10 flex justify-between items-center">
          <span className="text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Pending Verifications</span>
        </div>

        <div className="divide-y divide-sc-grey/5">
          {isLoading ? (
            <div className="p-12 text-center text-sc-grey/40 uppercase tracking-widest text-[10px] font-mono italic">
              Scanning identity signals...
            </div>
          ) : requests?.length > 0 ? (
            requests.map((req: any) => (
              <div key={req.id} className="p-6 flex flex-col md:flex-row justify-between items-center group hover:bg-white/5 transition-colors">
                <div className="flex items-center space-x-6">
                  <div className="h-12 w-12 rounded bg-sc-dark border border-sc-blue/20 flex items-center justify-center text-sc-blue">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white uppercase">{req.rsi_handle}</div>
                    <div className="text-[10px] text-sc-grey/40 font-mono">Citizen ID: {req.user?.id}</div>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex items-center space-x-4">
                  <a 
                    href={req.screenshot_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 border border-sc-grey/20 rounded text-sc-grey/40 hover:text-sc-blue hover:border-sc-blue transition-all"
                    title="View Evidence"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <button 
                    onClick={() => processMutation.mutate({ id: req.id, status: 'approved', notes: 'Verified via CLI' })}
                    className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-black uppercase tracking-widest rounded hover:bg-green-500/20 transition-all flex items-center"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                    Authorize
                  </button>
                  <button 
                    onClick={() => processMutation.mutate({ id: req.id, status: 'rejected', notes: 'Insufficient evidence' })}
                    className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black uppercase tracking-widest rounded hover:bg-red-500/20 transition-all flex items-center"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-2" />
                    Deny
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <p className="text-sc-grey/30 uppercase tracking-[0.3em] italic text-xs">No pending verification signals.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
