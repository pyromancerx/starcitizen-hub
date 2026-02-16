'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  User as UserIcon, 
  ShieldCheck, 
  MapPin, 
  Rocket, 
  Calendar,
  Lock,
  Globe,
  BadgeCheck,
  MessageSquare,
  Zap,
  ChevronLeft,
  Activity,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCall } from '@/context/CallContext';

export default function MemberDossierPage() {
  const { id } = useParams();
  const router = useRouter();
  const { initiateCall } = useCall();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['member-dossier', id],
    queryFn: async () => {
      const res = await api.get(`/social/members/${id}`);
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Activity className="w-12 h-12 text-sc-blue animate-pulse opacity-20" />
        <span className="text-[10px] text-sc-grey/40 uppercase tracking-[0.3em] italic">Accessing Restricted Dossier...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center p-24 bg-sc-panel border border-sc-blue/10 rounded-lg">
        <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4 text-red-500">Signal Lost</h2>
        <p className="text-xs text-sc-grey/60 uppercase tracking-widest mb-8">The requested citizen record does not exist or has been purged.</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-black rounded uppercase">Return to Registry</button>
      </div>
    );
  }

  const dossierStats = [
    { label: 'Asset Rating', value: 'Class A', icon: Rocket },
    { label: 'Security Clearance', value: profile.roles?.[0]?.name || 'Citizen', icon: ShieldCheck },
    { label: 'Deployment', value: 'Stanton', icon: MapPin },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Navigation */}
      <button 
        onClick={() => router.back()}
        className="flex items-center text-[10px] font-black text-sc-grey/40 hover:text-sc-blue uppercase tracking-widest transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
        Back to Registry
      </button>

      {/* Profile Header */}
      <div className="bg-sc-panel border border-sc-blue/20 rounded-lg overflow-hidden shadow-2xl relative">
        <div className="h-48 bg-gradient-to-r from-sc-dark via-sc-panel to-sc-dark relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-sc-panel via-transparent to-transparent"></div>
          
          {/* Tactical Overlay */}
          <div className="absolute inset-0 flex items-center justify-between px-12 opacity-10 pointer-events-none">
            <Globe className="w-64 h-64 -ml-20 rotate-12" />
            <ShieldCheck className="w-64 h-64 -mr-20 -rotate-12" />
          </div>
        </div>
        
        <div className="px-12 pb-12 flex flex-col md:flex-row items-end -mt-16 relative z-10 space-y-6 md:space-y-0 md:space-x-10">
          <div className="relative group">
            <div className="h-40 w-40 rounded bg-sc-dark border-4 border-sc-panel shadow-2xl flex items-center justify-center text-sc-blue relative overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Citizen Avatar" />
              ) : (
                <UserIcon className="w-20 h-20" />
              )}
            </div>
            {profile.is_rsi_verified && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-4 border-sc-panel shadow-xl">
                    <BadgeCheck className="w-5 h-5 text-white" />
                </div>
            )}
          </div>
          
          <div className="flex-1 space-y-2 text-center md:text-left pb-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">{profile.display_name}</h2>
                <span className="px-3 py-1 bg-sc-blue/10 border border-sc-blue/30 rounded text-[10px] font-black text-sc-blue uppercase tracking-[0.2em] self-center">
                    {profile.rsi_handle}
                </span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-[10px] font-black text-sc-grey/40 uppercase tracking-widest">
              <span className="flex items-center text-sc-blue/60">
                <Globe className="w-3.5 h-3.5 mr-2" />
                UES Identified
              </span>
              <span className="flex items-center">
                <Lock className="w-3.5 h-3.5 mr-2 text-green-500/50" />
                Record Verified
              </span>
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-2" />
                Registry Date: {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 pb-2">
            <button 
                onClick={() => router.push(`/messages?user=${profile.id}`)}
                className="p-4 bg-sc-blue/10 border border-sc-blue/30 text-sc-blue rounded hover:bg-sc-blue hover:text-sc-dark transition-all shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.1)]"
                title="Send Transmission"
            >
                <MessageSquare className="w-5 h-5" />
            </button>
            <button 
                onClick={() => initiateCall(profile.id, profile.display_name)}
                className="p-4 bg-sc-blue text-sc-dark border border-sc-blue rounded hover:bg-white transition-all shadow-[0_0_25px_rgba(var(--color-sc-blue-rgb),0.3)]"
                title="Establish Live Link"
            >
                <Zap className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dossierStats.map((stat) => (
          <div key={stat.label} className="bg-sc-panel border border-sc-grey/10 p-8 rounded-lg text-center space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <stat.icon className="w-12 h-12 text-sc-blue" />
            </div>
            <stat.icon className="w-8 h-8 text-sc-blue/40 mx-auto" />
            <div className="text-[10px] font-black text-sc-grey/30 uppercase tracking-[0.3em]">{stat.label}</div>
            <div className="text-xl font-black text-white italic tracking-widest">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Profile Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
            <section className="space-y-4">
                <h3 className="text-xs font-black text-sc-blue uppercase tracking-[0.4em] border-b border-sc-blue/20 pb-2 flex items-center">
                    <Activity className="w-4 h-4 mr-3" /> Service Record & Biography
                </h3>
                <div className="bg-sc-panel border border-sc-grey/10 rounded-lg p-8 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-sc-blue/20"></div>
                    <p className="text-sm text-sc-grey/60 italic leading-relaxed font-medium">
                        "{profile.biography || 'No biography data available in the primary databank. Citizen has not yet provided personal history logs for public record.'}"
                    </p>
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-xs font-black text-sc-blue uppercase tracking-[0.4em] border-b border-sc-blue/20 pb-2 flex items-center">
                    <Award className="w-4 h-4 mr-3" /> Merits & Achievements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.achievements?.map((ach: any) => (
                        <div key={ach.id} className="bg-sc-panel border border-sc-grey/10 rounded p-4 flex items-center space-x-4">
                            <div className="h-10 w-10 rounded bg-sc-dark border border-white/5 flex items-center justify-center text-yellow-500">
                                <Award className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-white uppercase tracking-widest">{ach.name}</div>
                                <div className="text-[8px] text-sc-grey/40 uppercase font-bold tracking-tighter mt-0.5">{new Date(ach.awarded_at).toLocaleDateString()}</div>
                            </div>
                        </div>
                    ))}
                    {(!profile.achievements || profile.achievements.length === 0) && (
                        <div className="col-span-full py-8 text-center bg-black/20 border border-dashed border-white/5 rounded text-[10px] font-black text-sc-grey/20 uppercase tracking-[0.3em]">
                            No institutional merits recorded.
                        </div>
                    )}
                </div>
            </section>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-xs font-black text-sc-blue uppercase tracking-[0.4em] border-b border-sc-blue/20 pb-2">Assigned Roles</h3>
            <div className="flex flex-col gap-3">
                {profile.roles?.map((role: any) => (
                <div key={role.id} className="p-4 bg-sc-dark border border-sc-blue/30 rounded flex items-center justify-between group hover:border-sc-blue transition-colors">
                    <div className="space-y-1">
                        <div className="text-xs font-black text-sc-blue uppercase tracking-widest">{role.name}</div>
                        <div className="text-[8px] text-sc-grey/40 uppercase font-bold italic">{role.tier} Tier</div>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-sc-blue/20 group-hover:text-sc-blue transition-colors" />
                </div>
                ))}
                {(!profile.roles || profile.roles.length === 0) && (
                <div className="text-[10px] text-sc-grey/30 uppercase italic p-4 bg-black/20 border border-white/5 rounded text-center">No command roles assigned.</div>
                )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-black text-sc-blue uppercase tracking-[0.4em] border-b border-sc-blue/20 pb-2 italic">Institutional Data</h3>
            <div className="bg-sc-panel border border-sc-grey/10 rounded p-6 space-y-4 font-mono text-[9px] uppercase tracking-widest text-sc-grey/40">
                <div className="flex justify-between">
                    <span>UUID:</span>
                    <span className="text-white">#{profile.id.toString().padStart(6, '0')}</span>
                </div>
                <div className="flex justify-between">
                    <span>STATUS:</span>
                    <span className="text-green-500">ACTIVE_SIGNAL</span>
                </div>
                <div className="flex justify-between">
                    <span>CLEARANCE:</span>
                    <span className="text-sc-blue">UNRESTRICTED</span>
                </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
