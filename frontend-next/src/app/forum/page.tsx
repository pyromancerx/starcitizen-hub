'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  MessageSquare, 
  ChevronRight, 
  Plus,
  Radio
} from 'lucide-react';
import Link from 'next/link';

export default function ForumPage() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['forum-categories'],
    queryFn: async () => {
      const res = await api.get('/forum/categories');
      return res.data;
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Spectrum Channels
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Encrypted Communication Hub
          </p>
        </div>
        <button className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Establish Channel
        </button>
      </div>

      {isLoading ? (
        <div className="p-24 text-center">
          <div className="animate-pulse flex flex-col items-center space-y-4">
            <Radio className="w-12 h-12 text-sc-blue opacity-20 animate-bounce" />
            <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic">Scanning frequencies...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {categories?.map((cat: any) => (
            <Link 
              key={cat.id} 
              href={`/forum/${cat.id}`}
              className="bg-sc-panel border border-sc-grey/10 p-6 rounded group hover:border-sc-blue/30 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-sc-blue opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-center relative z-10">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white uppercase tracking-tight group-hover:text-sc-blue transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-sc-grey/60 max-w-2xl italic">
                    {cat.description || 'Secure communication link established.'}
                  </p>
                </div>
                <div className="flex items-center space-x-8">
                  <div className="hidden md:flex flex-col items-end opacity-40">
                    <span className="text-[8px] font-black text-sc-grey uppercase tracking-widest">Signal Strength</span>
                    <div className="flex space-x-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={cn("w-1 h-3 rounded-full", i < 5 ? "bg-sc-blue" : "bg-sc-grey/20")}></div>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-sc-grey/20 group-hover:text-sc-blue group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper for class names (since I used it above)
import { cn } from '@/lib/utils';
