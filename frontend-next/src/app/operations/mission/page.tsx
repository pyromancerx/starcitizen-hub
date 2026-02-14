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
  Rocket,
  Box,
  ShoppingBag
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

  const { data: readiness, isLoading: readinessLoading } = useQuery({
    queryKey: ['operation-readiness', id],
    queryFn: async () => {
      const res = await api.get(`/game-data/operations/${id}/readiness`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: procurement } = useQuery({
    queryKey: ['operation-procurement', id],
    queryFn: async () => {
      const res = await api.get(`/operations/${id}/procurement`);
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

          {/* Mission Readiness HUD */}
          {readiness && (
            <div className="bg-sc-panel border border-sc-blue/20 rounded-lg overflow-hidden shadow-2xl relative">
                <div className="p-6 bg-black/20 border-b border-sc-blue/10 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Shield className={cn(
                            "w-5 h-5",
                            readiness.status === 'ready' ? "text-green-500" : readiness.status === 'warning' ? "text-yellow-500" : "text-red-500"
                        )} />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Mission Readiness HUD</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className={cn(
                            "w-1.5 h-1.5 rounded-full animate-pulse",
                            readiness.is_ready ? "bg-green-500" : "bg-red-500"
                        )}></div>
                        <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest",
                            readiness.is_ready ? "text-green-500" : "text-red-500"
                        )}>
                            {readiness.is_ready ? "Operational Ready" : "Under-Equipped"}
                        </span>
                    </div>
                </div>
                
                <div className="p-8 flex flex-col md:flex-row items-center gap-12">
                    <div className="relative h-32 w-32 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-white/5"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="58"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={364.4}
                                strokeDashoffset={364.4 - (364.4 * readiness.score) / 100}
                                className={cn(
                                    "transition-all duration-1000",
                                    readiness.status === 'ready' ? "text-green-500" : readiness.status === 'warning' ? "text-yellow-500" : "text-red-500"
                                )}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-white font-mono">{readiness.score}%</span>
                            <span className="text-[8px] text-sc-grey/40 font-bold uppercase">Signal</span>
                        </div>
                    </div>

                    <div className="flex-1 space-y-6">
                        <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-2">Tactical Readiness Assessment</h4>
                            <p className="text-[10px] text-sc-grey/60 uppercase leading-relaxed font-medium">
                                {readiness.is_ready 
                                    ? "Biometric and tactical scan confirms all required equipment is present in localized storage. You are authorized for deployment."
                                    : "Discrepancies detected in tactical manifest. Proactively acquire missing items before launch sequence to avoid mission failure."}
                            </p>
                        </div>

                        {!readiness.is_ready && readiness.missing_items?.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {readiness.missing_items.map((item: string, idx: number) => (
                                    <div key={idx} className="flex items-center space-x-3 p-2 bg-red-500/5 border border-red-500/20 rounded">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        <span className="text-[9px] font-black text-red-400 uppercase tracking-tighter">{item}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
          )}

          {/* Procurement Intelligence */}
          {procurement && procurement.length > 0 && (
            <div className="bg-sc-panel border border-white/5 rounded-lg overflow-hidden shadow-2xl">
                <div className="p-6 bg-black/20 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Box className="w-5 h-5 text-sc-blue" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Operational Procurement Intelligence</span>
                    </div>
                    <span className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest italic font-mono">Stockpile Analysis Engine v4.2</span>
                </div>
                <div className="p-8 space-y-6">
                    <p className="text-[10px] text-sc-grey/60 uppercase leading-relaxed font-bold tracking-widest max-w-2xl">
                        Logistical analysis of organization stockpiles against mission requirements. Proactive acquisition is recommended for all critical shortfalls.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {procurement.map((item: any, idx: number) => (
                            <div key={idx} className="p-4 bg-sc-dark/50 border border-sc-grey/10 rounded-lg flex items-center justify-between group hover:border-sc-blue/20 transition-all">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-white uppercase tracking-widest">{item.item_name}</div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-[8px] text-sc-grey/40 uppercase font-bold">Required: {item.required_qty}</span>
                                        <span className="text-[8px] text-sc-grey/20">•</span>
                                        <span className={cn(
                                            "text-[8px] font-bold uppercase",
                                            item.is_met ? "text-green-500" : "text-yellow-500"
                                        )}>In Stock: {item.stockpile_qty}</span>
                                    </div>
                                </div>
                                
                                {!item.is_met && (
                                    <div className="flex flex-col items-end space-y-1">
                                        <div className="flex items-center space-x-1.5 text-red-500">
                                            <ShoppingBag className="w-3 h-3" />
                                            <span className="text-[9px] font-black uppercase tracking-tighter">Shortfall: {item.shortfall}</span>
                                        </div>
                                        <div className="text-[7px] text-sc-grey/30 uppercase font-black tracking-widest">Procurement Req.</div>
                                    </div>
                                )}
                                {item.is_met && (
                                    <div className="h-6 w-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                                        <Shield className="w-3 h-3 text-green-500" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}

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
