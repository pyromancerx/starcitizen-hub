'use client';

import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  ArrowLeft, 
  Plus, 
  MessageSquare, 
  User as UserIcon,
  Clock,
  Pin
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

function CategoryContent() {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/forum" className="p-2 hover:bg-white/5 rounded text-sc-blue transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic">
              {isLoading ? 'Decrypting...' : category?.name}
            </h2>
            <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] font-mono">
              Signal Frequency: {id?.toString().padStart(3, '0')}.42 MHz
            </p>
          </div>
        </div>
        <button className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          New Transmission
        </button>
      </div>

      <div className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden shadow-2xl">
        <div className="bg-black/40 p-4 border-b border-sc-grey/10 flex justify-between items-center">
          <span className="text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Topic Identification</span>
          <span className="text-[10px] font-black text-sc-grey/50 uppercase tracking-widest w-32 text-right">Origin / Last Uplink</span>
        </div>

        <div className="divide-y divide-sc-grey/5">
          {isLoading ? (
            <div className="p-12 text-center text-sc-grey/40 uppercase tracking-widest text-[10px] font-mono animate-pulse">
              Synchronizing data packets...
            </div>
          ) : category?.threads?.length > 0 ? (
            category.threads.map((thread: any) => (
              <Link 
                key={thread.id} 
                href={`/forum/topic?id=${thread.id}`}
                className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-start space-x-4">
                  <div className={cn(
                    "mt-1 p-2 rounded bg-sc-dark border border-sc-grey/10",
                    thread.is_pinned ? "text-sc-blue border-sc-blue/30" : "text-sc-grey/30"
                  )}>
                    {thread.is_pinned ? <Pin className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white group-hover:text-sc-blue transition-colors">
                      {thread.title}
                    </h4>
                    <div className="flex items-center space-x-3 text-[10px] text-sc-grey/40 font-bold uppercase tracking-widest">
                      <span className="flex items-center">
                        <UserIcon className="w-3 h-3 mr-1" />
                        {thread.author?.display_name || 'Unknown Citizen'}
                      </span>
                      <span>•</span>
                      <span>{thread.view_count || 0} Scans</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end space-y-1">
                  <div className="text-[10px] text-white font-mono flex items-center">
                    <Clock className="w-3 h-3 mr-1.5 text-sc-blue/50" />
                    {new Date(thread.updated_at).toLocaleDateString()}
                  </div>
                  <span className="text-[8px] text-sc-grey/20 uppercase font-black">Link Active</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-24 text-center">
              <p className="text-sc-grey/30 uppercase tracking-[0.3em] italic text-sm">Static on all channels. No transmissions found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ForumCategoryPage() {
  return (
    <Suspense fallback={<div>Loading signal...</div>}>
      <CategoryContent />
    </Suspense>
  );
}