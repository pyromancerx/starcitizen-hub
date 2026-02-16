'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Users, 
  Search, 
  Filter, 
  User as UserIcon, 
  ExternalLink,
  MessageSquare,
  BadgeCheck,
  Zap,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useCall } from '@/context/CallContext';

export default function MembersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ verifiedOnly: false, commandOnly: false });
  const { initiateCall } = useCall();
  
  const { data: members, isLoading } = useQuery({
    queryKey: ['personnel-registry'],
    queryFn: async () => {
      const res = await api.get('/social/members');
      return res.data;
    },
  });

  const filteredMembers = members?.filter((m: any) => {
    const matchesSearch = m.display_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.rsi_handle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVerified = !filters.verifiedOnly || m.is_rsi_verified;
    const matchesCommand = !filters.commandOnly || m.roles?.some((r: any) => r.tier === 'admin' || r.tier === 'officer');
    
    return matchesSearch && matchesVerified && matchesCommand;
  });

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter italic border-l-4 border-sc-blue pl-4">
            Personnel Registry
          </h2>
          <p className="text-[10px] text-sc-blue font-mono uppercase tracking-[0.2em] ml-4">
            Authorized Citizen Data-Bank • Stanton Sector
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sc-grey/40" />
                <input 
                    placeholder="Neural Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-sc-dark/50 border border-sc-grey/10 rounded pl-9 pr-4 py-2 text-[10px] text-white focus:outline-none focus:border-sc-blue/50 uppercase tracking-widest font-bold w-full md:w-64"
                />
            </div>
            <div className="relative">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "p-2 border rounded transition-all",
                    showFilters ? "bg-sc-blue text-black border-sc-blue" : "bg-sc-panel border-sc-grey/10 text-sc-grey/40 hover:text-white"
                  )}
                >
                    <Filter className="w-4 h-4" />
                </button>
                
                {showFilters && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-sc-panel border border-sc-blue/20 rounded shadow-xl z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div onClick={() => setFilters(f => ({...f, verifiedOnly: !f.verifiedOnly}))} className="flex items-center space-x-2 cursor-pointer group select-none">
                      <div className={cn("w-3 h-3 border rounded-sm flex items-center justify-center transition-colors", filters.verifiedOnly ? "bg-sc-blue border-sc-blue" : "border-sc-grey/40 group-hover:border-white")}>
                        {filters.verifiedOnly && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-white tracking-widest">Verified Only</span>
                    </div>
                    <div onClick={() => setFilters(f => ({...f, commandOnly: !f.commandOnly}))} className="flex items-center space-x-2 cursor-pointer group select-none">
                      <div className={cn("w-3 h-3 border rounded-sm flex items-center justify-center transition-colors", filters.commandOnly ? "bg-sc-blue border-sc-blue" : "border-sc-grey/40 group-hover:border-white")}>
                         {filters.commandOnly && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-white tracking-widest">Command Staff</span>
                    </div>
                  </div>
                )}
            </div>
        </div>
      </div>

      {/* Registry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full p-24 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Users className="w-12 h-12 text-sc-blue opacity-20 animate-pulse" />
              <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic font-mono">Accessing Personnel Files...</span>
            </div>
          </div>
        ) : filteredMembers?.map((member: any) => (
          <CitizenCard key={member.id} member={member} onCall={() => initiateCall(member.id, member.display_name)} />
        ))}

        {filteredMembers?.length === 0 && !isLoading && (
            <div className="col-span-full p-24 text-center bg-sc-panel border border-dashed border-white/5 rounded-lg opacity-40">
                <p className="text-xs font-black uppercase tracking-[0.3em]">No matching signals detected in the Stanton sector.</p>
            </div>
        )}
      </div>
    </div>
  );
}

const CitizenCard = ({ member, onCall }: { member: any, onCall: () => void }) => {
    const router = useRouter();

    return (
        <div className="bg-sc-panel border border-sc-blue/10 rounded-lg overflow-hidden group hover:border-sc-blue/40 transition-all duration-500 shadow-xl relative">
            {/* Top Pattern */}
            <div className="h-1 bg-sc-blue opacity-20 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                    <div className="relative">
                        <div className="h-16 w-16 rounded bg-sc-dark border border-white/5 flex items-center justify-center text-sc-blue/40 group-hover:text-sc-blue transition-colors overflow-hidden">
                            {member.avatar_url ? (
                                <img src={member.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                            ) : (
                                <UserIcon className="w-8 h-8" />
                            )}
                        </div>
                        {member.is_rsi_verified && (
                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-sc-panel">
                                <BadgeCheck className="w-3 h-3 text-white" />
                            </div>
                        )}
                    </div>
                    <div className="text-right space-y-1">
                        <div className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">RSI Match</div>
                        <div className={cn(
                            "text-[10px] font-black uppercase tracking-tighter",
                            member.is_rsi_verified ? "text-green-500" : "text-yellow-500"
                        )}>
                            {member.is_rsi_verified ? 'Authorized' : 'Pending'}
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest truncate group-hover:text-sc-blue transition-colors">
                        {member.display_name}
                    </h3>
                    <div className="flex items-center text-[9px] text-sc-grey/40 uppercase font-bold tracking-widest">
                        <Globe className="w-3 h-3 mr-1.5 opacity-50" />
                        {member.rsi_handle}
                    </div>
                </div>

                {/* Roles */}
                <div className="flex flex-wrap gap-1.5 min-h-[40px] align-top">
                    {member.roles?.map((role: any) => (
                        <span key={role.id} className="px-2 py-0.5 bg-sc-blue/5 border border-sc-blue/20 rounded text-[7px] font-black text-sc-blue uppercase tracking-widest">
                            {role.name}
                        </span>
                    ))}
                    {(!member.roles || member.roles.length === 0) && (
                        <span className="text-[7px] text-sc-grey/20 uppercase font-black italic">No assigned roles</span>
                    )}
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={() => router.push(`/messages?user=${member.id}`)}
                            className="p-2 bg-sc-dark border border-white/5 rounded text-sc-grey/40 hover:text-sc-blue transition-all"
                            title="Message"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button 
                            onClick={onCall}
                            className="p-2 bg-sc-dark border border-white/5 rounded text-sc-grey/40 hover:text-white transition-all"
                            title="Live Link"
                        >
                            <Zap className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <button 
                        onClick={() => router.push(`/profile/dossier?id=${member.id}`)}
                        className="text-[8px] font-black text-sc-grey/40 hover:text-white uppercase tracking-[0.2em] flex items-center group/dossier"
                    >
                        Dossier <ExternalLink className="w-2.5 h-2.5 ml-1.5 group-hover/dossier:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Hover FX */}
            <div className="absolute inset-0 bg-sc-blue/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
        </div>
    );
};
