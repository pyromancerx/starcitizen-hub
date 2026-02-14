'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Plus, 
  Volume2, 
  Shield, 
  Settings, 
  MoreVertical,
  Trash2,
  Lock,
  Globe
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

interface VoiceChannel {
  id: number;
  name: string;
  description: string;
  is_private: boolean;
}

interface VoiceChannelListProps {
  onJoin: (channel: VoiceChannel) => void;
  activeChannelId?: number;
  roomPresence?: Map<string, number[]>;
}

const VoiceChannelList: React.FC<VoiceChannelListProps> = ({ onJoin, activeChannelId, roomPresence }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const isAdmin = user?.roles?.some(r => r.tier === 'admin' || r.tier === 'officer');

  const { data: channels, isLoading } = useQuery<VoiceChannel[]>({
    queryKey: ['voice-channels'],
    queryFn: async () => {
      const res = await api.get('/social/voice-channels');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post('/social/voice-channels', {
        name: newName,
        is_private: isPrivate,
        description: 'Persistent voice frequency'
      });
    },
    onSuccess: () => {
      setShowCreate(false);
      setNewName('');
      queryClient.invalidateQueries({ queryKey: ['voice-channels'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/social/voice-channels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-channels'] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-4">
        <h3 className="text-[10px] font-black text-sc-blue uppercase tracking-[0.3em]">Comm Frequencies</h3>
        {isAdmin && (
          <button 
            onClick={() => setShowCreate(true)}
            className="p-1 hover:bg-sc-blue/10 rounded transition-colors text-sc-blue"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-1">
        {isLoading ? (
          <div className="p-4 text-center text-[10px] text-sc-grey/40 uppercase animate-pulse">Scanning bands...</div>
        ) : channels?.map((channel) => {
          const presence = roomPresence?.get(`room_${channel.id}`) || [];
          return (
            <div 
              key={channel.id}
              className={cn(
                "group flex items-center justify-between px-4 py-3 rounded transition-all cursor-pointer",
                activeChannelId === channel.id 
                  ? "bg-sc-blue/10 border-l-2 border-sc-blue" 
                  : "hover:bg-white/5 border-l-2 border-transparent"
              )}
              onClick={() => onJoin(channel)}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "p-2 rounded bg-sc-dark border",
                  activeChannelId === channel.id ? "border-sc-blue/30 text-sc-blue" : "border-sc-grey/10 text-sc-grey/40"
                )}>
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white uppercase tracking-widest">{channel.name}</span>
                    {channel.is_private ? (
                      <Lock className="w-3 h-3 text-sc-grey/40" />
                    ) : (
                      <Globe className="w-3 h-3 text-sc-grey/40" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <div className={cn(
                        "w-1 h-1 rounded-full animate-pulse",
                        presence.length > 0 ? "bg-green-500" : "bg-sc-grey/20"
                    )}></div>
                    <div className="text-[8px] text-sc-grey/40 font-mono uppercase tracking-tighter">
                        {presence.length} Citizens Active • {channel.is_private ? 'Secure' : 'Open'}
                    </div>
                  </div>
                </div>
              </div>
              
              {isAdmin && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm('Decommission frequency?')) deleteMutation.mutate(channel.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-sc-grey/40 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showCreate && (
        <div className="p-4 border-t border-sc-grey/10 bg-black/20 space-y-3">
          <input 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Frequency Name..."
            className="w-full bg-sc-dark border border-sc-grey/20 rounded px-3 py-2 text-[10px] text-white focus:outline-none focus:border-sc-blue/50 uppercase font-bold tracking-widest"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isPrivate} 
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-sc-grey/20 rounded-full peer peer-checked:bg-sc-blue transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
              <span className="text-[9px] font-black text-sc-grey/60 uppercase">Encrypted</span>
            </label>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowCreate(false)}
                className="px-3 py-1 text-[9px] font-black text-sc-grey/40 hover:text-white uppercase transition-colors"
              >
                Abort
              </button>
              <button 
                onClick={() => createMutation.mutate()}
                disabled={!newName.trim()}
                className="px-3 py-1 bg-sc-blue/20 border border-sc-blue/40 text-sc-blue text-[9px] font-black rounded uppercase hover:bg-sc-blue hover:text-sc-dark transition-all disabled:opacity-20"
              >
                Establish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceChannelList;
