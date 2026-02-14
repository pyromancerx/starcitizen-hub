'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Trophy, 
  ChevronRight, 
  Award,
  Star,
  Zap,
  Target,
  Plus,
  X,
  User as UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export default function AchievementsPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantData, setGrantData] = useState({
    user_id: 0,
    achievement_id: 0,
    award_note: ''
  });

  const isAdmin = currentUser?.roles?.some(r => r.tier === 'admin' || r.tier === 'officer');

  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const res = await api.get('/social/achievements');
      return res.data;
    },
  });

  const { data: members } = useQuery({
    queryKey: ['member-list-awards'],
    queryFn: async () => {
      const res = await api.get('/social/members');
      return res.data;
    },
    enabled: isAdmin && showGrantModal,
  });

  const grantMutation = useMutation({
    mutationFn: async () => {
      return api.post('/social/achievements/award', grantData); // Note: Verify POST in Go
    },
    onSuccess: () => {
      setShowGrantModal(false);
      alert('Merit citation broadcast to organizational records.');
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
        {isAdmin && (
            <button 
                onClick={() => setShowGrantModal(true)}
                className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue hover:text-sc-dark transition-all flex items-center"
            >
                <Plus className="w-4 h-4 mr-2" />
                Grant Merit Citation
            </button>
        )}
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

      {/* Grant Citation Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-md">
            <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-xl shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Award className="w-5 h-5 text-sc-blue" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Merit Citation Authorization</h3>
                    </div>
                    <button onClick={() => setShowGrantModal(false)} className="text-sc-grey/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Recipient Citizen</label>
                            <select 
                                value={grantData.user_id}
                                onChange={(e) => setGrantData({...grantData, user_id: Number(e.target.value)})}
                                className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none appearance-none"
                            >
                                <option value="0">Select Citizen...</option>
                                {members?.map((m: any) => (
                                    <option key={m.id} value={m.id}>{m.display_name} ({m.rsi_handle})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Achievement Designation</label>
                            <select 
                                value={grantData.achievement_id}
                                onChange={(e) => setGrantData({...grantData, achievement_id: Number(e.target.value)})}
                                className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none appearance-none"
                            >
                                <option value="0">Select Achievement...</option>
                                {achievements?.map((a: any) => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Command Award Note</label>
                        <textarea 
                            value={grantData.award_note}
                            onChange={(e) => setGrantData({...grantData, award_note: e.target.value})}
                            rows={3}
                            placeholder="Reason for citation..."
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end space-x-4">
                    <button 
                        onClick={() => setShowGrantModal(false)}
                        className="px-6 py-2 text-[10px] font-black text-sc-grey/40 hover:text-white uppercase tracking-widest"
                    >
                        Abort
                    </button>
                    <button 
                        onClick={() => grantMutation.mutate()}
                        disabled={grantMutation.isPending || !grantData.user_id || !grantData.achievement_id}
                        className="px-8 py-2 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all disabled:opacity-20"
                    >
                        {grantMutation.isPending ? 'Broadcasting...' : 'Grant Citation'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
