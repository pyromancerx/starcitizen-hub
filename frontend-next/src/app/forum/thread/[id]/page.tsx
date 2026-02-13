'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  ArrowLeft, 
  User as UserIcon,
  Clock,
  Send,
  Lock,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function ForumThreadPage() {
  const { id } = useParams();

  const { data: thread, isLoading } = useQuery({
    queryKey: ['forum-thread', id],
    queryFn: async () => {
      const res = await api.get(`/forum/threads/${id}`);
      return res.data;
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => window.history.back()}
          className="p-2 hover:bg-white/5 rounded text-sc-blue transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            {isLoading ? 'Establishing Uplink...' : thread?.title}
          </h2>
          <div className="flex items-center space-x-4 ml-4 text-[10px] text-sc-grey/40 uppercase font-black tracking-widest">
            <span className="flex items-center">
              <UserIcon className="w-3 h-3 mr-1.5" />
              Origin: {thread?.author?.display_name || 'System'}
            </span>
            <span>•</span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1.5 text-sc-blue/50" />
              Broadcast: {thread?.created_at ? new Date(thread.created_at).toLocaleString() : '---'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="p-24 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue mx-auto mb-4"></div>
            <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic">Downloading encrypted packets...</span>
          </div>
        ) : thread?.posts?.map((post: any, index: number) => (
          <div key={post.id} className={cn(
            "bg-sc-panel border rounded overflow-hidden flex transition-all duration-300",
            index === 0 ? "border-sc-blue/20" : "border-sc-grey/10"
          )}>
            {/* Author Sidebar */}
            <div className="w-48 bg-black/40 border-r border-sc-grey/5 p-6 flex flex-col items-center space-y-4 hidden sm:flex">
              <div className="h-20 w-20 rounded bg-sc-dark border border-sc-blue/20 flex items-center justify-center text-sc-blue shadow-[0_0_10px_rgba(var(--color-sc-blue-rgb),0.1)]">
                <UserIcon className="w-10 h-10" />
              </div>
              <div className="text-center space-y-1">
                <div className="text-xs font-bold text-white uppercase truncate w-full">{post.author?.display_name}</div>
                <div className="text-[8px] text-sc-blue font-black uppercase tracking-[0.2em]">{post.author?.rsi_handle || 'Citizen'}</div>
              </div>
              <div className="pt-4 border-t border-sc-grey/5 w-full space-y-2">
                <div className="flex justify-between text-[8px] font-black uppercase text-sc-grey/30">
                  <span>Signals</span>
                  <span>42</span>
                </div>
                <div className="w-full bg-sc-dark h-1 rounded-full overflow-hidden">
                  <div className="bg-sc-blue h-full w-2/3 shadow-[0_0_5px_#66fcf1]"></div>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="flex-1 flex flex-col">
              <div className="p-6 text-sm text-sc-grey/90 leading-relaxed font-medium whitespace-pre-wrap">
                {post.content}
              </div>
              <div className="mt-auto px-6 py-3 bg-black/20 border-t border-sc-grey/5 flex justify-between items-center">
                <span className="text-[9px] font-mono text-sc-grey/30">POCKET_ID: {post.id.toString().padStart(8, '0')}</span>
                <div className="flex space-x-4">
                  <button className="text-[9px] font-black uppercase text-sc-blue/50 hover:text-sc-blue transition-colors">Quote</button>
                  <button className="text-[9px] font-black uppercase text-sc-grey/30 hover:text-white transition-colors">Report</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Area */}
      <div className="bg-sc-panel border border-sc-blue/30 rounded p-6 shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.05)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 text-sc-blue opacity-5">
          <Send className="w-24 h-24" />
        </div>
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="w-4 h-4 text-sc-blue" />
          <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Encode New Transmission</h3>
        </div>
        <textarea 
          placeholder="Enter message text..."
          className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded p-4 text-sm text-white min-h-[150px] focus:outline-none focus:border-sc-blue/50 transition-all placeholder-sc-grey/20"
        />
        <div className="mt-4 flex justify-between items-center">
          <div className="flex space-x-4 opacity-40">
            <span className="text-[8px] font-black uppercase text-sc-grey">Encryption: AES-256</span>
            <span className="text-[8px] font-black uppercase text-sc-grey">Protocol: HubLink 2.0</span>
          </div>
          <button className="px-8 py-2.5 bg-sc-blue text-sc-dark text-xs font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.3)]">
            Relay Signal
          </button>
        </div>
      </div>
    </div>
  );
}
