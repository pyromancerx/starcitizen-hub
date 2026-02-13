'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Users, 
  ChevronRight, 
  Plus,
  MessageSquare,
  Search,
  Zap,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CrewFinderPage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['crew-posts'],
    queryFn: async () => {
      const res = await api.get('/crew/posts');
      return res.data;
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Crew Finder
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Strategic Multi-Crew Deployment & LFG
          </p>
        </div>
        <button className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Post LFG Signal
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="p-24 text-center">
            <Users className="w-12 h-12 text-sc-blue opacity-20 animate-bounce mx-auto mb-4" />
            <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic font-mono">Scanning Stanton for active signals...</span>
          </div>
        ) : posts?.length > 0 ? (
          posts.map((post: any) => (
            <div 
              key={post.id} 
              className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden flex group hover:border-sc-blue/30 transition-all duration-300"
            >
              <div className="w-1.5 bg-sc-blue opacity-20 group-hover:opacity-100 transition-opacity"></div>
              <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-sc-blue/5 border border-sc-blue/20 rounded text-[8px] font-black uppercase text-sc-blue tracking-widest">
                      {post.activity_type}
                    </span>
                    <span className="text-[10px] text-sc-grey/30 font-mono">#{post.id.toString().padStart(5, '0')}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight italic">{post.title}</h3>
                  <p className="text-xs text-sc-grey/60 line-clamp-1">{post.description}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest block">Available Slots</span>
                  <div className="flex space-x-1">
                    {[...Array(post.max_crew)].map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "w-2 h-4 rounded-sm border transition-all",
                          i < post.current_crew ? "bg-sc-blue border-sc-blue shadow-[0_0_5px_#66fcf1]" : "border-sc-grey/20 bg-black/20"
                        )}
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="px-6 py-2 border border-sc-blue/30 text-sc-blue text-[10px] font-black uppercase tracking-widest rounded hover:bg-sc-blue hover:text-sc-dark transition-all">
                    Establish Comms
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-sc-panel border border-sc-grey/10 p-24 text-center rounded">
            <p className="text-sc-grey/30 uppercase tracking-[0.3em] text-sm italic">All channels quiet. Post a signal to find crew.</p>
          </div>
        )}
      </div>
    </div>
  );
}
