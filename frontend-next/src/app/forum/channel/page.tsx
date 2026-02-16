'use client';

import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  ArrowLeft, 
  Plus, 
  MessageCircle, 
  User as UserIcon, 
  Clock,
  Eye,
  ChevronRight,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

function ChannelContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const { data: category, isLoading } = useQuery({
    queryKey: ['forum-category', id],
    queryFn: async () => {
      const res = await api.get(`/forum/categories/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <Link href="/forum" className="p-2 hover:bg-white/5 rounded text-sc-blue transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="space-y-1">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest italic">{isLoading ? 'Synchronizing...' : category?.name}</h2>
                <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] font-mono">
                    Channel Frequency: {id?.toString().padStart(3, '0')} • {category?.threads?.length || 0} Active Topics
                </p>
            </div>
        </div>
        <button 
            onClick={() => alert('Spectrum relay busy: New topic broadcast is temporarily queued. [Form Placeholder]')}
            className="px-6 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-black uppercase rounded hover:bg-sc-blue hover:text-sc-dark transition-all flex items-center space-x-2"
        >
            <Plus className="w-4 h-4" />
            <span>Broadcast New Topic</span>
        </button>
      </div>

      <div className="bg-sc-panel border border-white/5 rounded-lg overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/40 border-b border-white/5">
              <tr>
                <th className="px-8 py-4 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest w-full">Topic Transmission</th>
                <th className="px-8 py-4 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest text-center">Author</th>
                <th className="px-8 py-4 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest text-center">Engagement</th>
                <th className="px-8 py-4 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {category?.threads?.map((thread: any) => (
                <tr key={thread.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <Link href={`/forum/topic?id=${thread.id}`} className="block space-y-1">
                        <div className="flex items-center space-x-3">
                            <FileText className="w-4 h-4 text-sc-blue opacity-40 group-hover:opacity-100 transition-opacity" />
                            <span className="text-sm font-bold text-white uppercase tracking-tight group-hover:text-sc-blue transition-colors">
                                {thread.title}
                            </span>
                        </div>
                        <div className="flex items-center space-x-4 text-[9px] text-sc-grey/40 uppercase font-bold tracking-widest pl-7">
                            <span className="flex items-center"><Clock className="w-3 h-3 mr-1.5" /> {new Date(thread.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>Standard Clearance</span>
                        </div>
                    </Link>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-center space-y-1">
                        <div className="w-6 h-6 rounded bg-sc-dark border border-sc-blue/20 flex items-center justify-center text-sc-blue">
                            <UserIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[9px] font-black text-white uppercase">{thread.author?.display_name || 'Pilot'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-center space-y-1 opacity-40">
                        <span className="text-[10px] font-bold text-white font-mono">{thread.view_count || 0}</span>
                        <div className="flex items-center text-[7px] font-black uppercase tracking-tighter">
                            <Eye className="w-2.5 h-2.5 mr-1" /> Receptions
                        </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-sc-blue shadow-[0_0_8px_rgba(var(--color-sc-blue-rgb),0.5)]"></div>
                    </div>
                  </td>
                </tr>
              ))}
              {(!category?.threads || category.threads.length === 0) && !isLoading && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-sc-grey/20 uppercase tracking-[0.3em] font-black italic">
                    All frequencies clear. No active topics detected in this channel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ChannelPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center uppercase font-black text-sc-blue animate-pulse tracking-[0.5em]">Tuning Frequency...</div>}>
      <ChannelContent />
    </Suspense>
  );
}
