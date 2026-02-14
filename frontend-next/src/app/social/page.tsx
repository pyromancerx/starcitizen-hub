'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  MessageSquare, 
  Users, 
  Video, 
  Radio, 
  Search,
  Settings,
  ShieldAlert,
  Wifi,
  SignalHigh,
  Phone,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import VoiceChannelList from '@/components/VoiceChannelList';
import CallOverlay from '@/components/CallOverlay';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useAuthStore } from '@/store/authStore';
import { useCall } from '@/context/CallContext';

export default function SocialHubPage() {
  const queryClient = useQueryClient();
  const [activeChannel, setActiveChannel] = useState<any>(null);
  const { user } = useAuthStore();
  const { initiateCall } = useCall();
  const { 
    localStream, 
    peers, 
    roomPresence,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    error,
    connectionStatus,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare
  } = useWebRTC(activeChannel ? `room_${activeChannel.id}` : undefined, !!activeChannel);

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['social-members-links'],
    queryFn: async () => {
      const res = await api.get('/social/members');
      return res.data;
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/social/voice-channels', data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['voice-channels'] });
      setActiveChannel(res.data);
    },
  });

  const handleQuickJoin = () => {
    createChannelMutation.mutate({
        name: `Direct Tactical Link: ${user?.display_name}`,
        is_private: false
    });
  };

  const handleTestSignal = () => {
    setActiveChannel({ id: 'test_freq', name: 'Local Test Frequency' });
  };

  const totalCitizensActive = roomPresence ? Array.from(roomPresence.values()).flat().length : 0;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-6">
      {/* ... (Connection status code remains same) ... */}
      {/* Connection Status Banner */}
      {(error || connectionStatus === 'connecting') && (
          <div className={cn(
            "p-2 text-center text-[10px] font-black uppercase tracking-[0.3em] animate-pulse rounded border",
            connectionStatus === 'connecting' ? "bg-sc-blue/10 border-sc-blue/30 text-sc-blue" : "bg-red-500/10 border-red-500/30 text-red-500"
          )}>
            {connectionStatus === 'connecting' ? "Re-establishing Signal Matrix..." : error}
          </div>
      )}

      {/* Top Stats/Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusCard 
          icon={<Radio className="w-4 h-4" />} 
          label="Comm Status" 
          value="Operational" 
          color="text-green-500" 
        />
        <StatusCard 
          icon={<Users className="w-4 h-4" />} 
          label="Active Personnel" 
          value={`${totalCitizensActive || 0} Citizens`} 
          color="text-sc-blue" 
        />
        <StatusCard 
          icon={<SignalHigh className="w-4 h-4" />} 
          label="Link Encryption" 
          value="AES-256-HUB" 
          color="text-sc-blue" 
        />
        <StatusCard 
          icon={<ShieldAlert className="w-4 h-4" />} 
          label="Admin Oversight" 
          value="Active" 
          color="text-sc-blue" 
        />
      </div>

      <div className="flex-1 flex space-x-6 min-h-0">
        {/* Left Sidebar: Channels & Frequencies */}
        <div className="w-80 bg-sc-panel border border-sc-blue/10 rounded-lg flex flex-col overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Social Matrix</span>
            <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] text-green-500 font-bold uppercase">Live</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar py-4">
            <VoiceChannelList 
              onJoin={(channel) => setActiveChannel(channel)} 
              activeChannelId={activeChannel?.id} 
              roomPresence={roomPresence}
            />
            
            <div className="mt-8 border-t border-white/5 pt-6 px-4">
                <h3 className="text-[10px] font-black text-sc-grey/40 uppercase tracking-[0.3em] mb-4">Direct Links</h3>
                <div className="space-y-2">
                    {membersLoading ? (
                        <div className="text-[10px] uppercase font-bold text-center italic py-4 text-sc-grey/20">Scanning frequencies...</div>
                    ) : members?.filter((m: any) => m.id !== user?.id).length > 0 ? (
                        members.filter((m: any) => m.id !== user?.id).slice(0, 10).map((member: any) => (
                            <button 
                                key={member.id}
                                onClick={() => initiateCall(member.id, member.display_name)}
                                className="w-full flex items-center justify-between p-2 rounded hover:bg-sc-blue/5 border border-transparent hover:border-sc-blue/20 transition-all group"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-6 h-6 rounded bg-sc-dark border border-white/5 flex items-center justify-center text-[10px] font-bold text-sc-grey/40 group-hover:text-sc-blue transition-colors">
                                        {member.display_name[0]}
                                    </div>
                                    <span className="text-[10px] font-bold text-sc-grey/60 group-hover:text-white uppercase truncate">{member.display_name}</span>
                                </div>
                                <Phone className="w-3 h-3 text-sc-blue/40 opacity-0 group-hover:opacity-100 transition-all" />
                            </button>
                        ))
                    ) : (
                        <div className="text-[10px] uppercase font-bold text-center italic py-4 text-sc-grey/20">No other citizens found.</div>
                    )}
                </div>
            </div>
          </div>
        </div>

        {/* Main Content Area: Prominent Calling Interface */}
        <div className="flex-1 bg-sc-panel border border-sc-blue/10 rounded-lg flex flex-col relative overflow-hidden shadow-2xl group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-sc-blue)_0%,_transparent_70%)] opacity-[0.03]"></div>
            
            {!activeChannel ? (
                <div className="h-full flex flex-col items-center justify-center space-y-8 p-12 text-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-sc-blue/20 blur-3xl rounded-full"></div>
                        <div className="h-32 w-32 rounded-full border-2 border-sc-blue/20 flex items-center justify-center relative bg-sc-dark">
                            <Wifi className="w-12 h-12 text-sc-blue/40 animate-pulse" />
                        </div>
                    </div>
                    
                    <div className="max-w-md space-y-4">
                        <h2 className="text-xl font-black text-white uppercase tracking-[0.4em]">Sub-Space Comms</h2>
                        <p className="text-xs text-sc-grey/60 leading-relaxed uppercase tracking-widest font-medium">
                            Select a frequency from the social matrix to establish a real-time voice and video link with organization personnel.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                        <button 
                            onClick={handleQuickJoin}
                            disabled={createChannelMutation.isPending}
                            className="p-4 border border-sc-blue/20 rounded bg-sc-blue/5 hover:bg-sc-blue/10 transition-all flex flex-col items-center space-y-2 group/btn"
                        >
                            <Radio className="w-5 h-5 text-sc-blue group-hover/btn:scale-110 transition-transform" />
                            <span className="text-[9px] font-black text-sc-blue uppercase">
                                {createChannelMutation.isPending ? 'Linking...' : 'Quick Join'}
                            </span>
                        </button>
                        <button 
                            onClick={handleTestSignal}
                            className="p-4 border border-white/10 rounded bg-white/5 hover:bg-white/10 transition-all flex flex-col items-center space-y-2 group/btn"
                        >
                            <Video className="w-5 h-5 text-sc-grey group-hover/btn:scale-110 transition-transform" />
                            <span className="text-[9px] font-black text-sc-grey uppercase">Test Signal</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-sc-blue/20 flex justify-between items-center bg-sc-blue/5">
                        <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 bg-sc-blue/10 border border-sc-blue/30 rounded flex items-center justify-center">
                                <Radio className="w-6 h-6 text-sc-blue" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white uppercase tracking-widest">{activeChannel.name}</h2>
                                <p className="text-[10px] text-sc-blue font-mono uppercase">Frequency Locked • {peers.size + 1} Citizens Online</p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button className="px-6 py-2 bg-red-500/20 border border-red-500/50 text-red-500 text-[10px] font-black rounded uppercase hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]" onClick={() => setActiveChannel(null)}>
                                Disconnect
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 p-8 grid grid-cols-2 gap-6 overflow-y-auto custom-scrollbar">
                        {/* Featured local preview */}
                        <div className="relative aspect-video bg-sc-dark border border-sc-blue/30 rounded-lg overflow-hidden ring-4 ring-sc-blue/5">
                             <video 
                                ref={(el) => { if (el && localStream) el.srcObject = localStream; }} 
                                autoPlay 
                                muted 
                                playsInline 
                                className="w-full h-full object-cover mirror"
                            />
                            <div className="absolute top-4 right-4 flex space-x-2">
                                <div className="px-2 py-1 bg-sc-blue/80 text-sc-dark text-[8px] font-black rounded uppercase">Source: Local</div>
                            </div>
                            <div className="absolute bottom-4 left-4 flex items-center space-x-2">
                                <div className="w-2 h-2 bg-sc-blue rounded-full animate-ping"></div>
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest shadow-lg">{user?.display_name || 'Citizen'}</span>
                            </div>
                        </div>

                        {/* Remote participants */}
                        {Array.from(peers.values()).map((peer) => (
                             <div key={peer.id} className="relative aspect-video bg-sc-dark border border-white/10 rounded-lg overflow-hidden grayscale hover:grayscale-0 transition-all duration-500">
                                <video 
                                    ref={(el) => { if (el && peer.stream) el.srcObject = peer.stream; }} 
                                    autoPlay 
                                    playsInline 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm border border-white/10 rounded text-[10px] text-sc-grey font-bold uppercase tracking-widest">
                                    Citizen #{peer.id}
                                </div>
                             </div>
                        ))}

                        {peers.size === 0 && (
                            <div className="aspect-video border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center space-y-3 opacity-30">
                                <Users className="w-8 h-8" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Awaiting Peers...</span>
                            </div>
                        )}
                    </div>

                    {/* Prominent Controls Bar */}
                    <div className="p-6 bg-black/40 border-t border-sc-blue/10 flex justify-center items-center space-x-8">
                         <ControlBtn 
                            icon={<ShieldAlert className="w-5 h-5" />} 
                            label="Security" 
                            onClick={() => {}} 
                         />
                         <ControlBtn 
                            icon={<Wifi className="w-5 h-5" />} 
                            label="Bandwidth" 
                            onClick={() => {}} 
                         />
                         <ControlBtn 
                            icon={isVideoEnabled ? <Video className="w-5 h-5" /> : <Video className="w-5 h-5 opacity-50" />} 
                            label={isVideoEnabled ? "Video On" : "Video Off"} 
                            active={isVideoEnabled} 
                            onClick={toggleVideo} 
                         />
                         <ControlBtn 
                            icon={isAudioEnabled ? <Radio className="w-5 h-5" /> : <Radio className="w-5 h-5 opacity-50" />} 
                            label={isAudioEnabled ? "Audio On" : "Audio Muted"} 
                            active={isAudioEnabled} 
                            onClick={toggleAudio} 
                         />
                         <ControlBtn 
                            icon={<Settings className="w-5 h-5" />} 
                            label="Config" 
                            onClick={() => {}} 
                         />
                    </div>
                </div>
            )}
        </div>
      </div>

      {activeChannel && (
          <CallOverlay 
            localStream={localStream} 
            peers={peers} 
            onClose={() => setActiveChannel(null)} 
            title={activeChannel.name}
            isAudioEnabled={isAudioEnabled}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
          />
      )}
    </div>
  );
}

const StatusCard = ({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
  <div className="bg-sc-panel border border-sc-blue/10 p-4 rounded-lg shadow-xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity">
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-12 h-12" })}
    </div>
    <div className="flex items-center space-x-3 mb-1">
      <div className="text-sc-blue/40">{icon}</div>
      <span className="text-[9px] font-black text-sc-grey/40 uppercase tracking-[0.2em]">{label}</span>
    </div>
    <div className={cn("text-xs font-bold uppercase tracking-widest", color)}>{value}</div>
  </div>
);

const ControlBtn = ({ icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
    <div className="flex flex-col items-center space-y-2">
        <button 
            onClick={onClick}
            className={cn(
            "h-12 w-12 rounded-full border transition-all flex items-center justify-center group",
            active 
                ? "bg-sc-blue/10 border-sc-blue text-sc-blue hover:bg-sc-blue hover:text-sc-dark" 
                : "bg-sc-dark border-white/10 text-sc-grey/40 hover:border-white/20 hover:text-white"
        )}>
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5 group-hover:scale-110 transition-transform" })}
        </button>
        <span className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">{label}</span>
    </div>
)
