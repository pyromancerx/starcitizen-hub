'use client';

import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, Users, Monitor, MonitorOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallOverlayProps {
  localStream: MediaStream | null;
  peers: Map<number, { id: number; stream?: MediaStream }>;
  onClose: () => void;
  title: string;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
  isScreenSharing?: boolean;
  onToggleAudio?: () => void;
  onToggleVideo?: () => void;
  onToggleScreenShare?: () => void;
}

const CallOverlay: React.FC<CallOverlayProps> = ({ 
  localStream, 
  peers, 
  onClose, 
  title,
  isAudioEnabled = true,
  isVideoEnabled = true,
  isScreenSharing = false,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return (
    <div className="fixed inset-0 z-50 bg-sc-dark/95 flex flex-col backdrop-blur-md">
      {/* Header */}
      <div className="p-4 bg-black/40 border-b border-sc-blue/20 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-sc-blue/10 border border-sc-blue/30 rounded-full flex items-center justify-center animate-pulse">
            <Users className="w-5 h-5 text-sc-blue" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">{title}</h2>
            <p className="text-[10px] text-sc-blue/60 font-mono uppercase">SECURE SUB-SPACE LINK • {peers.size + 1} ACTIVE SIGNALS</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
            <button 
                onClick={() => alert('Neural link maximization protocol initialized... [UI Scaling Placeholder]')}
                className="p-2 text-sc-grey/40 hover:text-white transition-colors"
            >
                <Maximize2 className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar">
        {/* Local Stream */}
        <div className="relative aspect-video bg-sc-panel border border-sc-blue/10 rounded-lg overflow-hidden group">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline 
            className={cn("w-full h-full object-cover", !isScreenSharing && "mirror")}
          />
          <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm border border-sc-blue/20 rounded text-[10px] text-sc-blue font-bold uppercase tracking-widest">
            Local Signal (You)
          </div>
          {!isAudioEnabled && (
            <div className="absolute top-4 right-4 p-2 bg-red-500/20 rounded-full border border-red-500/50">
              <MicOff className="w-4 h-4 text-red-500" />
            </div>
          )}
        </div>

        {/* Remote Streams */}
        {Array.from(peers.values()).map((peer) => {
          if (!peer || !peer.id) return null;
          return <RemoteVideo key={peer.id} stream={peer.stream} userId={peer.id} />;
        })}
      </div>

      {/* Controls */}
      <div className="p-8 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-center space-x-6">
        <button 
          onClick={onToggleAudio}
          className={cn(
            "h-14 w-14 rounded-full border flex items-center justify-center transition-all group",
            isAudioEnabled 
              ? "bg-sc-panel border-sc-blue/20 text-sc-blue hover:bg-sc-blue hover:text-sc-dark" 
              : "bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white"
          )}
        >
          {isAudioEnabled ? <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" /> : <MicOff className="w-6 h-6 group-hover:scale-110 transition-transform" />}
        </button>
        
        <button 
          onClick={onToggleVideo}
          className={cn(
            "h-14 w-14 rounded-full border flex items-center justify-center transition-all group",
            isVideoEnabled 
              ? "bg-sc-panel border-sc-blue/20 text-sc-blue hover:bg-sc-blue hover:text-sc-dark" 
              : "bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white"
          )}
        >
          {isVideoEnabled ? <Video className="w-6 h-6 group-hover:scale-110 transition-transform" /> : <VideoOff className="w-6 h-6 group-hover:scale-110 transition-transform" />}
        </button>

        <button 
          onClick={onToggleScreenShare}
          className={cn(
            "h-14 w-14 rounded-full border flex items-center justify-center transition-all group",
            isScreenSharing
              ? "bg-green-500/20 border-green-500/50 text-green-500 hover:bg-green-500 hover:text-white"
              : "bg-sc-panel border-sc-blue/20 text-sc-blue hover:bg-sc-blue hover:text-sc-dark" 
          )}
        >
          {isScreenSharing ? <MonitorOff className="w-6 h-6 group-hover:scale-110 transition-transform" /> : <Monitor className="w-6 h-6 group-hover:scale-110 transition-transform" />}
        </button>

        <button 
          onClick={onClose}
          className="h-16 w-16 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] group"
        >
          <PhoneOff className="w-8 h-8 group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </div>
  );
};

const RemoteVideo = ({ stream, userId }: { stream?: MediaStream, userId: number }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative aspect-video bg-sc-panel border border-white/5 rounded-lg overflow-hidden group">
      {stream ? (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-sc-dark border border-sc-grey/10 flex items-center justify-center text-sc-grey/20">
                <Users className="w-8 h-8" />
            </div>
            <span className="text-[10px] text-sc-grey/40 uppercase font-bold tracking-widest animate-pulse">Establishing Signal...</span>
        </div>
      )}
      <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-sm border border-white/10 rounded text-[10px] text-sc-grey font-bold uppercase tracking-widest">
        Citizen #{userId}
      </div>
    </div>
  );
};

export default CallOverlay;
