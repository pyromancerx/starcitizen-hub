'use client';

import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  Clock, 
  Target,
  Rocket
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

function MissionContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const { data: operation, isLoading } = useQuery({
    queryKey: ['operation', id],
    queryFn: async () => {
      const res = await api.get(`/operations/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center space-x-4">
        <Link href="/operations" className="p-2 hover:bg-white/5 rounded text-sc-blue transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            {isLoading ? 'Decrypting Intel...' : operation?.title}
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] font-mono ml-4">
            Mission Reference: OP-{id?.toString().padStart(4, '0')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-sc-panel border border-sc-grey/10 rounded-lg p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Shield className="w-32 h-32" />
            </div>
            <h3 className="text-sm font-black text-sc-blue uppercase tracking-widest mb-4 border-b border-sc-blue/20 pb-2 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Mission Briefing
            </h3>
            <p className="text-sc-grey/80 leading-relaxed italic">
              {operation?.description || 'No classified data available for this operation.'}
            </p>
          </div>

          <div className="bg-sc-panel border border-sc-grey/10 rounded-lg p-8">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 border-b border-sc-grey/10 pb-2">Crew Manifest</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {operation?.participants?.map((p: any) => (
                <div key={p.id} className="bg-sc-dark/50 border border-sc-grey/10 p-4 rounded flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded bg-sc-panel border border-sc-blue/20 flex items-center justify-center text-sc-blue">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white uppercase">{p.user?.display_name}</div>
                      <div className="text-[8px] text-sc-blue font-black uppercase tracking-widest">{p.role_preference || 'Crew'}</div>
                    </div>
                  </div>
                  <span className="text-[8px] font-black text-green-500 uppercase px-2 py-0.5 bg-green-500/5 border border-green-500/20 rounded">Confirmed</span>
                </div>
              ))}
              {(!operation?.participants || operation.participants.length === 0) && (
                <div className="col-span-full p-8 text-center text-sc-grey/30 uppercase tracking-widest text-[10px] italic">
                  Waiting for crew assignment...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-sc-panel border border-sc-blue/20 rounded-lg p-6 space-y-6 shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.05)]">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-sc-grey/40">Operation Status</span>
                <span className="text-sc-blue">{operation?.status || 'Planning'}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-sc-grey/40">Deployment Time</span>
                <span className="text-white font-mono">{operation?.scheduled_at ? new Date(operation.scheduled_at).toLocaleString() : 'TBD'}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-sc-grey/40">Max Capacity</span>
                <span className="text-white">{operation?.max_participants || 'Unrestricted'}</span>
              </div>
            </div>

            <button className="w-full py-3 bg-sc-blue text-sc-dark text-xs font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.3)]">
              Enlist for Deployment
            </button>
          </div>

          <div className="bg-sc-panel border border-sc-grey/10 rounded-lg p-6">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-4">Tactical Requirements</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-xs text-sc-grey/60">
                <Rocket className="w-3.5 h-3.5 text-sc-blue/50" />
                <span>Medium Fighter or larger</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-sc-grey/60">
                <Shield className="w-3.5 h-3.5 text-sc-blue/50" />
                <span>Class 2 Body Armor</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OperationDetailPage() {
  return (
    <Suspense fallback={<div>Loading mission intel...</div>}>
      <MissionContent />
    </Suspense>
  );
}
