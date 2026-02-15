'use client';

import React, { Suspense, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  Clock, 
  Target,
  Rocket,
  Box,
  ShoppingBag,
  X,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

function MissionContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const queryClient = useQueryClient();
  const [showShipSelect, setShowShipSelect] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  const { data: operation, isLoading } = useQuery({
    queryKey: ['operation', id],
    queryFn: async () => {
      const res = await api.get(`/operations/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Pre-fill edit form when data is loaded
  React.useEffect(() => {
    if (operation && !editForm) {
        setEditForm({
            title: operation.title,
            description: operation.description,
            type: operation.type,
            scheduled_at: operation.scheduled_at ? new Date(operation.scheduled_at).toISOString().slice(0, 16) : '',
            required_roles: operation.required_roles || '',
            required_ship_types: operation.required_ship_types || '',
            security_level: operation.security_level || 'public',
            comms_frequency: operation.comms_frequency || '',
            intel_url: operation.intel_url || '',
            hazards: operation.hazards || '',
            status: operation.status || 'planning'
        });
    }
  }, [operation, editForm]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.patch(`/operations/${id}`, data);
    },
    onSuccess: () => {
      setShowEditModal(false);
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      alert('Mission parameters updated and synchronized.');
    },
  });

  const { data: myShips } = useQuery({
    queryKey: ['my-ships'],
    queryFn: async () => {
      const res = await api.get('/ships/');
      return res.data;
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (shipId?: number) => {
      return api.post(`/operations/${id}/signup`, {
        ship_id: shipId,
        role_preference: 'Pilot'
      });
    },
    onSuccess: () => {
      setShowShipSelect(false);
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      queryClient.invalidateQueries({ queryKey: ['operation-readiness', id] });
      alert('Deployment authorized. Welcome to the wing, Citizen.');
    },
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

  const { data: user } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    }
  });

  const volunteerMutation = useMutation({
    mutationFn: async (role: string) => {
      return api.post(`/operations/${id}/volunteer-sub`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      alert('Application transmitted. Awaiting command approval.');
    },
  });

  const processSubMutation = useMutation({
    mutationFn: async ({ subId, status }: { subId: number, status: string }) => {
      return api.post(`/operations/sub-leaders/${subId}/process`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      alert('Sub-leader status updated.');
    },
  });

  const isLeader = operation?.created_by_id === user?.id;
  const isAdminOrOfficer = user?.roles?.some((r: any) => r.tier === 'admin' || r.tier === 'officer');
  const canEdit = isLeader || isAdminOrOfficer;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
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
        
        {canEdit && (
            <button 
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center"
            >
                <Target className="w-3.5 h-3.5 mr-2" />
                Modify Parameters
            </button>
        )}
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
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 border-b border-sc-grey/10 pb-2">Command Staff</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {operation?.sub_leaders?.map((sub: any) => (
                <div key={sub.id} className={cn(
                    "p-4 rounded flex items-center justify-between transition-all border",
                    sub.status === 'active' ? "bg-sc-blue/5 border-sc-blue/20" : "bg-sc-dark/50 border-white/5 opacity-60"
                )}>
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                        "w-10 h-10 rounded flex items-center justify-center border",
                        sub.status === 'active' ? "bg-sc-panel border-sc-blue text-sc-blue" : "bg-sc-dark border-sc-grey/20 text-sc-grey/40"
                    )}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white uppercase">{sub.user?.display_name}</div>
                      <div className="text-[8px] text-sc-blue font-black uppercase tracking-widest">{sub.role_title} • {sub.status}</div>
                    </div>
                  </div>
                  
                  {isLeader && sub.status === 'candidate' && (
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => processSubMutation.mutate({ subId: sub.id, status: 'active' })}
                            className="p-1 hover:text-green-500 transition-colors"
                        >
                            <Shield className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => processSubMutation.mutate({ subId: sub.id, status: 'rejected' })}
                            className="p-1 hover:text-red-500 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                  )}
                </div>
              ))}
              {(!operation?.sub_leaders || operation.sub_leaders.length === 0) && (
                <div className="col-span-full p-4 border border-dashed border-white/5 rounded text-center text-[10px] text-sc-grey/20 uppercase font-black italic">
                    No sub-commanders assigned to this operation.
                </div>
              )}
            </div>

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
                <span className="text-sc-grey/40">Security Level</span>
                <span className={cn(
                    "px-2 py-0.5 rounded border",
                    operation?.security_level === 'public' ? "text-green-500 border-green-500/20" :
                    operation?.security_level === 'internal' ? "text-sc-blue border-sc-blue/20" :
                    "text-red-500 border-red-500/20 animate-pulse"
                )}>
                    {operation?.security_level || 'Public'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-sc-grey/40">Operation Status</span>
                <span className="text-sc-blue">{operation?.status || 'Planning'}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-sc-grey/40">Deployment Time</span>
                <span className="text-white font-mono">{operation?.scheduled_at ? new Date(operation.scheduled_at).toLocaleString() : 'TBD'}</span>
              </div>
              {operation?.comms_frequency && (
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-sc-grey/40">Primary Frequency</span>
                    <span className="text-sc-blue font-mono">{operation.comms_frequency}</span>
                </div>
              )}
              {operation?.intel_url && (
                <a 
                    href={operation.intel_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest group hover:text-sc-blue transition-colors"
                >
                    <span className="text-sc-grey/40 group-hover:text-sc-blue/60">Tactical Intel</span>
                    <div className="flex items-center space-x-1">
                        <span className="text-white group-hover:text-sc-blue border-b border-white/20 group-hover:border-sc-blue/40">Secure Link</span>
                        <ChevronRight className="w-3 h-3" />
                    </div>
                </a>
              )}
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-sc-grey/40">Max Capacity</span>
                <span className="text-white">{operation?.max_participants || 'Unrestricted'}</span>
              </div>
            </div>

            <button 
                onClick={() => setShowShipSelect(true)}
                className="w-full py-3 bg-sc-blue text-sc-dark text-xs font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.3)]"
            >
              Enlist for Deployment
            </button>

            {!isLeader && !operation?.sub_leaders?.find((s: any) => s.user_id === user?.id) && (
                <button 
                    onClick={() => {
                        const role = prompt("Enter requested sub-leader role (e.g. Flight Lead, Ground Lead):");
                        if (role) volunteerMutation.mutate(role);
                    }}
                    className="w-full py-3 mt-3 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                    Volunteer for Command Position
                </button>
            )}
          </div>

          <div className="bg-sc-panel border border-sc-grey/10 rounded-lg p-6">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Tactical Requirements</h4>
            <div className="space-y-6">
              {operation?.required_roles && (
                <div className="space-y-2">
                  <span className="text-[8px] font-black text-sc-blue uppercase tracking-widest">Requested Personnel Roles</span>
                  <div className="flex flex-wrap gap-2">
                    {operation.required_roles.split(',').map((role: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-sc-blue/5 border border-sc-blue/20 rounded text-[9px] font-bold text-white uppercase">{role.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              {operation?.required_ship_types && (
                <div className="space-y-2">
                  <span className="text-[8px] font-black text-sc-blue uppercase tracking-widest">Requested Vessel Classes</span>
                  <div className="flex flex-wrap gap-2">
                    {operation.required_ship_types.split(',').map((ship: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-white uppercase">{ship.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              {!operation?.required_roles && !operation?.required_ship_types && (
                <div className="text-[9px] text-sc-grey/40 uppercase italic">No specific asset or role requirements recorded.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ship Selection Modal */}
      {showShipSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/90 backdrop-blur-md">
            <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-xl shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Rocket className="w-5 h-5 text-sc-blue" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Deployment Authorization</h3>
                    </div>
                    <button onClick={() => setShowShipSelect(false)} className="text-sc-grey/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <p className="text-[10px] text-sc-grey/60 uppercase font-black tracking-widest leading-relaxed">
                            Assign a vessel from your personal registry to this operation. Tactical configuration and readiness score will be calculated upon selection.
                        </p>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                        {myShips?.map((ship: any) => (
                            <button 
                                key={ship.id}
                                onClick={() => signupMutation.mutate(ship.id)}
                                disabled={signupMutation.isPending}
                                className="w-full p-4 bg-sc-dark border border-white/5 rounded flex items-center justify-between group hover:border-sc-blue/40 transition-all text-left"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="h-10 w-10 bg-sc-panel border border-sc-blue/10 rounded flex items-center justify-center text-sc-blue/40 group-hover:text-sc-blue transition-colors">
                                        <Rocket className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-white uppercase tracking-widest">{ship.name}</div>
                                        <div className="text-[8px] text-sc-grey/40 uppercase font-mono">{ship.ship_type}</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-sc-grey/20 group-hover:text-sc-blue transition-all" />
                            </button>
                        ))}
                        {(!myShips || myShips.length === 0) && (
                            <div className="p-8 text-center border border-dashed border-white/5 rounded text-sc-grey/30 uppercase text-[9px] font-black tracking-widest">
                                No vessels detected in personal registry.
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <button 
                            onClick={() => signupMutation.mutate(undefined)}
                            disabled={signupMutation.isPending}
                            className="w-full py-3 bg-white/5 border border-white/10 text-sc-grey/40 text-[10px] font-black rounded uppercase hover:text-white hover:bg-white/10 transition-all flex items-center justify-center space-x-2"
                        >
                            <span>Enlist as Infantry / Crew (No Ship)</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Edit Operation Modal */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-xl">
            <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-4xl shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Target className="w-5 h-5 text-sc-blue" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Update Mission Parameters</h3>
                    </div>
                    <button onClick={() => setShowEditModal(false)} className="text-sc-grey/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Operation Status</label>
                            <select 
                                value={editForm.status}
                                onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                                className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none appearance-none font-bold uppercase"
                            >
                                <option value="planning">Planning</option>
                                <option value="active">Active / In Progress</option>
                                <option value="completed">Mission Accomplished</option>
                                <option value="cancelled">Aborted</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Mission Title</label>
                            <input 
                                value={editForm.title}
                                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none font-bold uppercase tracking-widest"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Security Classification</label>
                            <select 
                                value={editForm.security_level}
                                onChange={(e) => setEditForm({...editForm, security_level: e.target.value})}
                                className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none appearance-none font-bold uppercase"
                            >
                                <option value="public">Public</option>
                                <option value="internal">Internal</option>
                                <option value="restricted">Restricted</option>
                                <option value="classified">Classified</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Deployment Time</label>
                            <input 
                                type="datetime-local"
                                value={editForm.scheduled_at}
                                onChange={(e) => setEditForm({...editForm, scheduled_at: e.target.value})}
                                className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Requested Roles</label>
                            <input 
                                value={editForm.required_roles}
                                onChange={(e) => setEditForm({...editForm, required_roles: e.target.value})}
                                className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Requested Vessels</label>
                            <input 
                                value={editForm.required_ship_types}
                                onChange={(e) => setEditForm({...editForm, required_ship_types: e.target.value})}
                                className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Briefing Intel</label>
                            <textarea 
                                value={editForm.description}
                                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                rows={5}
                                className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none resize-none italic"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end space-x-4">
                    <button 
                        onClick={() => setShowEditModal(false)}
                        className="px-6 py-2 text-[10px] font-black text-sc-grey/40 hover:text-white uppercase tracking-widest"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => updateMutation.mutate(editForm)}
                        disabled={updateMutation.isPending}
                        className="px-8 py-2 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all disabled:opacity-20"
                    >
                        {updateMutation.isPending ? 'Synchronizing...' : 'Save Parameters'}
                    </button>
                </div>
            </div>
        </div>
      )}
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
