'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Users, 
  ChevronRight, 
  Plus,
  MessageSquare,
  Search,
  Zap,
  Target,
  X,
  Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CrewFinderPage() {
  const queryClient = useQueryClient();
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    activity_type: 'Combat',
    max_crew: 2,
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ['crew-posts'],
    queryFn: async () => {
      const res = await api.get('/crew/posts');
      return res.data;
    },
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      return api.post('/crew/posts', newPost);
    },
    onSuccess: () => {
      setShowPostModal(false);
      queryClient.invalidateQueries({ queryKey: ['crew-posts'] });
      alert('Multi-crew signal broadcast to all tactical channels.');
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
        <button 
            onClick={() => setShowPostModal(true)}
            className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center"
        >
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
                  <button 
                    onClick={() => alert(`Establishing encrypted comms link with mission lead... [Signal Placeholder]`)}
                    className="px-6 py-2 border border-sc-blue/30 text-sc-blue text-[10px] font-black uppercase tracking-widest rounded hover:bg-sc-blue hover:text-sc-dark transition-all"
                  >
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

      {/* Post LFG Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sc-dark/95 backdrop-blur-md">
            <div className="bg-sc-panel border border-sc-blue/30 rounded-lg w-full max-w-xl shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 bg-black/40 border-b border-sc-blue/10 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-sc-blue" />
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Multi-Crew Signal Authorization</h3>
                    </div>
                    <button onClick={() => setShowPostModal(false)} className="text-sc-grey/40 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Signal Title</label>
                        <input 
                            value={newPost.title}
                            onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                            placeholder="e.g. Hammerhead Turret Gunners needed..."
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Activity Core</label>
                        <select 
                            value={newPost.activity_type}
                            onChange={(e) => setNewPost({...newPost, activity_type: e.target.value})}
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none appearance-none"
                        >
                            <option value="Combat">Combat</option>
                            <option value="Mining">Mining</option>
                            <option value="Salvage">Salvage</option>
                            <option value="Industrial">Industrial</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Max Crew Authorized</label>
                        <input 
                            type="number"
                            value={newPost.max_crew}
                            onChange={(e) => setNewPost({...newPost, max_crew: Number(e.target.value)})}
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none font-mono"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Signal Parameters (Description)</label>
                        <textarea 
                            value={newPost.description}
                            onChange={(e) => setNewPost({...newPost, description: e.target.value})}
                            rows={3}
                            placeholder="Deployment details and role requirements..."
                            className="w-full bg-sc-dark border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="p-6 bg-black/40 border-t border-white/5 flex justify-end space-x-4">
                    <button 
                        onClick={() => setShowPostModal(false)}
                        className="px-6 py-2 text-[10px] font-black text-sc-grey/40 hover:text-white uppercase tracking-widest"
                    >
                        Abort
                    </button>
                    <button 
                        onClick={() => postMutation.mutate()}
                        disabled={postMutation.isPending || !newPost.title || !newPost.description}
                        className="px-8 py-2 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all disabled:opacity-20"
                    >
                        {postMutation.isPending ? 'Broadcasting...' : 'Broadcast Signal'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
