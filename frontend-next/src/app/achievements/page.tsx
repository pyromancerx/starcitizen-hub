'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Trophy, 
  ChevronRight, 
  Award,
  Star,
  Zap,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const res = await api.get('/achievements/'); // Go backend needs to support this
      return res.data;
    },
  });

  const rarityColors: Record<string, string> = {
    common: 'text-sc-grey border-sc-grey/20 bg-sc-grey/5',
    rare: 'text-sc-blue border-sc-blue/20 bg-sc-blue/5',
    epic: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
    legendary: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5',
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Service Recognition
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Organization Merit & Honor System
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full p-24 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Zap className="w-12 h-12 text-sc-blue opacity-20 animate-pulse" />
              <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic font-mono">Parsing service records...</span>
            </div>
          </div>
        ) : achievements?.length > 0 ? (
          achievements.map((achievement: any) => (
            <div 
              key={achievement.id} 
              className="bg-sc-panel border border-sc-grey/10 rounded-lg p-6 group hover:border-sc-blue/30 transition-all duration-300 relative overflow-hidden flex items-start space-x-4"
            >
              <div className={cn(
                "h-16 w-16 rounded border flex items-center justify-center flex-shrink-0 shadow-2xl transition-all group-hover:scale-110",
                rarityColors[achievement.rarity?.toLowerCase() || 'common']
              )}>
                <Trophy className="w-8 h-8" />
              </div>
              
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest truncate">{achievement.name}</h3>
                  <span className="text-[8px] font-mono text-sc-blue font-bold tracking-tighter">+{achievement.points} PTS</span>
                </div>
                <p className="text-[10px] text-sc-grey/60 italic line-clamp-2 leading-relaxed">
                  {achievement.description || 'Awarded for exceptional service to the organization.'}
                </p>
                <div className="pt-2">
                  <div className={cn(
                    "inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                    rarityColors[achievement.rarity?.toLowerCase() || 'common']
                  )}>
                    {achievement.rarity}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-sc-panel border border-sc-grey/10 p-24 text-center rounded">
            <p className="text-sc-grey/30 uppercase tracking-[0.3em] text-sm italic">Service history is clear. Achievements will be logged as earned.</p>
          </div>
        )}
      </div>
    </div>
  );
}
