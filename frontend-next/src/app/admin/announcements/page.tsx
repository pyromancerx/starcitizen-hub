'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Pin,
  Clock,
  User as UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    category: 'general',
    is_pinned: false,
    is_public: true
  });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const res = await api.get('/announcements');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/announcements', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      setShowAddModal(false);
      setNewAnnouncement({ title: '', content: '', category: 'general', is_pinned: false, is_public: true });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center">
            <Megaphone className="w-4 h-4 mr-2 text-sc-blue" />
            Global Broadcast System
          </h3>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-2 bg-sc-blue text-sc-dark text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.2)] flex items-center"
        >
          <Plus className="w-3 h-3 mr-2" />
          Queue Announcement
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-sc-grey/40 uppercase tracking-widest text-[10px] italic">Accessing broadcast logs...</div>
        ) : announcements?.length > 0 ? (
          announcements.map((ann: any) => (
            <div key={ann.id} className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden flex group hover:border-sc-blue/20 transition-all">
              <div className={cn("w-1.5", ann.is_pinned ? "bg-sc-blue" : "bg-sc-grey/20")}></div>
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 bg-sc-blue/5 border border-sc-blue/20 rounded text-[8px] font-black uppercase text-sc-blue tracking-widest">{ann.category}</span>
                      {ann.is_pinned && <Pin className="w-3 h-3 text-sc-blue" />}
                    </div>
                    <h4 className="text-lg font-bold text-white uppercase italic">{ann.title}</h4>
                  </div>
                  <button 
                    onClick={() => { if(confirm('Delete announcement?')) deleteMutation.mutate(ann.id); }}
                    className="p-2 text-sc-grey/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-sc-grey/70 leading-relaxed mb-4">{ann.content}</p>
                <div className="flex items-center space-x-4 text-[9px] font-bold uppercase text-sc-grey/30 tracking-widest">
                  <span className="flex items-center"><UserIcon className="w-3 h-3 mr-1" /> {ann.author?.display_name}</span>
                  <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(ann.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-sc-panel border border-sc-grey/10 p-12 text-center rounded">
            <p className="text-sc-grey/30 uppercase tracking-[0.2em] text-xs italic">No active broadcasts found.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-sc-panel border border-sc-blue/30 rounded shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-sc-grey/10 bg-black/20 flex justify-between items-center">
              <h3 className="text-xs font-black text-sc-blue uppercase tracking-[0.2em]">New Operational Broadcast</h3>
              <button onClick={() => setShowAddModal(false)} className="text-sc-grey hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(newAnnouncement); }} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Broadcast Title</label>
                <input required value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})} className="w-full bg-sc-dark border border-sc-grey/20 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all uppercase" placeholder="Operation XenoThreat Update" />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Category</label>
                <select value={newAnnouncement.category} onChange={(e) => setNewAnnouncement({...newAnnouncement, category: e.target.value})} className="w-full bg-sc-dark border border-sc-grey/20 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all uppercase">
                  <option value="general">General</option>
                  <option value="operations">Operations</option>
                  <option value="logistics">Logistics</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Transmission Content</label>
                <textarea required rows={5} value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})} className="w-full bg-sc-dark border border-sc-grey/20 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all" placeholder="Enter transmission details..." />
              </div>
              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={newAnnouncement.is_pinned} onChange={(e) => setNewAnnouncement({...newAnnouncement, is_pinned: e.target.checked})} className="w-4 h-4 bg-sc-dark border-sc-grey/20 text-sc-blue rounded focus:ring-0" />
                  <span className="text-[9px] font-black text-sc-grey/60 uppercase tracking-widest">Priority Pin</span>
                </label>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={createMutation.isPending} className="w-full py-3 bg-sc-blue text-sc-dark text-xs font-black uppercase tracking-widest hover:bg-white transition-all">
                  {createMutation.isPending ? 'Relaying...' : 'Broadcast to Organization'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
