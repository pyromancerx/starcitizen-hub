'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  MapPin,
  MessageSquare,
  ChevronRight,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: members, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await api.get('/admin/users'); // Reuse users list for now
      return res.data;
    },
  });

  const filteredMembers = members?.filter((m: any) => 
    m.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.rsi_handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Personnel Directory
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Active Citizen Signal Index
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sc-grey/40" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Scan frequencies..."
            className="bg-sc-panel border border-sc-grey/20 rounded pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all uppercase tracking-widest font-bold min-w-[250px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full p-24 text-center">
            <Users className="w-12 h-12 text-sc-blue opacity-20 animate-pulse mx-auto mb-4" />
            <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic">Synchronizing member database...</span>
          </div>
        ) : filteredMembers?.map((member: any) => (
          <div 
            key={member.id} 
            className="bg-sc-panel border border-sc-grey/10 rounded-lg p-6 group hover:border-sc-blue/30 transition-all duration-300 relative overflow-hidden"
          >
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-16 w-16 rounded bg-sc-dark border border-sc-grey/10 flex items-center justify-center text-sc-blue shadow-xl group-hover:border-sc-blue/20 transition-all">
                {member.avatar_url ? <img src={member.avatar_url} className="rounded" /> : <Users className="w-8 h-8" />}
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm font-black text-white uppercase tracking-widest truncate">{member.display_name}</h3>
                <div className="flex items-center text-[9px] text-sc-blue font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {member.rsi_handle || 'CITIZEN'}
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-2 text-[10px] text-sc-grey/60 uppercase font-bold tracking-widest">
                <Shield className="w-3.5 h-3.5 opacity-50" />
                <span>{member.roles?.[0]?.name || 'Member'}</span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] text-sc-grey/60 uppercase font-bold tracking-widest">
                <MapPin className="w-3.5 h-3.5 opacity-50" />
                <span>Stanton System</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link 
                href={`/messages?user=${member.id}`}
                className="flex-1 py-2 bg-sc-blue/5 hover:bg-sc-blue/10 border border-sc-blue/20 rounded text-[9px] font-black uppercase text-sc-blue tracking-widest transition-all text-center flex items-center justify-center"
              >
                <MessageSquare className="w-3 h-3 mr-1.5" /> Comms
              </Link>
              <Link 
                href={`/profile?id=${member.id}`}
                className="flex-1 py-2 bg-sc-panel hover:bg-sc-grey/5 border border-sc-grey/10 rounded text-[9px] font-black uppercase text-sc-grey/60 hover:text-white transition-all text-center"
              >
                Dossier
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
