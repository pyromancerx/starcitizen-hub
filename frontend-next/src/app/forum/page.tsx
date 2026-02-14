'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  MessageSquare, 
  ChevronRight, 
  Plus,
  Radio,
  MessageCircle,
  Lock,
  Globe,
  History
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ForumPage() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['forum-categories'],
    queryFn: async () => {
      const res = await api.get('/forum/categories');
      return res.data;
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Forum Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-sc-panel border border-sc-blue/20 p-8 rounded-lg relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-5">
            <MessageSquare className="w-48 h-48 text-sc-blue" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Spectrum Relay</h2>
          <p className="text-[10px] text-sc-blue font-mono uppercase tracking-[0.2em]">Institutional Communication Network • Stanton Sector</p>
        </div>
        <div className="flex items-center space-x-6 relative z-10">
            <div className="text-right">
                <div className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Active Channels</div>
                <div className="text-xl font-bold text-white font-mono">{categories?.length || 0}</div>
            </div>
            <div className="h-10 w-px bg-sc-grey/10"></div>
            <div className="text-right">
                <div className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Signal Status</div>
                <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Linked</span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="p-24 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Radio className="w-12 h-12 text-sc-blue opacity-20 animate-pulse" />
              <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic font-mono">Synchronizing Spectrum Frequencies...</span>
            </div>
          </div>
        ) : categories?.map((cat: any) => (
          <Link 
            key={cat.id} 
            href={`/forum/channel?id=${cat.id}`}
            className="bg-sc-panel border border-white/5 rounded-lg overflow-hidden flex group hover:border-sc-blue/30 transition-all duration-300 shadow-xl"
          >
            {/* Icon/Color Side */}
            <div className="w-20 bg-sc-dark border-r border-sc-grey/5 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                <div className="p-3 bg-sc-blue/5 border border-sc-blue/20 rounded-full text-sc-blue/40 group-hover:text-sc-blue group-hover:bg-sc-blue/10 transition-all">
                    <MessageCircle className="w-6 h-6" />
                </div>
            </div>

            {/* Info Area */}
            <div className="flex-1 p-6 flex flex-col justify-center min-w-0">
              <div className="flex items-center space-x-3 mb-1">
                <h3 className="text-lg font-black text-white uppercase tracking-widest group-hover:text-sc-blue transition-colors truncate">
                  {cat.name}
                </h3>
                {cat.is_private ? (
                    <Lock className="w-3.5 h-3.5 text-sc-grey/40" />
                ) : (
                    <Globe className="w-3.5 h-3.5 text-sc-grey/40" />
                )}
              </div>
              <p className="text-[11px] text-sc-grey/60 uppercase font-bold tracking-tight line-clamp-1">
                {cat.description || 'Standard institutional discussion frequency.'}
              </p>
            </div>

            {/* Stats Area */}
            <div className="hidden md:flex items-center px-8 space-x-8 bg-black/20">
                <div className="text-center w-16">
                    <div className="text-[10px] font-bold text-white font-mono">{cat.threads?.length || 0}</div>
                    <div className="text-[7px] font-black text-sc-grey/40 uppercase tracking-tighter">Topics</div>
                </div>
                <div className="text-center w-16">
                    <div className="text-[10px] font-bold text-white font-mono">142</div>
                    <div className="text-[7px] font-black text-sc-grey/40 uppercase tracking-tighter">Transmissions</div>
                </div>
                <ChevronRight className="w-5 h-5 text-sc-grey/20 group-hover:text-sc-blue group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      {/* Forum Rules/Status Bar */}
      <div className="p-6 bg-sc-blue/5 border border-sc-blue/10 rounded flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <History className="w-4 h-4 text-sc-blue/40" />
            <span className="text-[9px] font-black text-sc-grey/40 uppercase tracking-widest leading-relaxed">
                All transmissions are recorded and archived. Follow standard organization comms protocols.
            </span>
        </div>
        <span className="text-[8px] font-mono text-sc-blue/40 uppercase">Latency: 14ms • Stanton-Net</span>
      </div>
    </div>
  );
}
