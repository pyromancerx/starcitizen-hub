'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Phone, PhoneOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import CallOverlay from '@/components/CallOverlay';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useSignaling } from './SignalingContext';

interface CallContextType {
  initiateCall: (targetId: number, name: string) => void;
  incomingCall: any;
  setIncomingCall: (call: any) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  const { send, subscribe } = useSignaling();
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [activeCall, setActiveCall] = useState<any>(null);

  const { 
    localStream, 
    peers,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare
  } = useWebRTC(activeCall ? `direct_${activeCall.id}` : undefined);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribe((data) => {
      if (data.type === 'call-request') {
        setIncomingCall(data);
      }
    });

    return () => unsubscribe();
  }, [user, subscribe]);

  const initiateCall = (targetId: number, name: string) => {
    send({
      type: 'call-request',
      target_id: targetId,
      sender_name: user?.display_name
    });
    setActiveCall({ id: targetId, name });
  };

  const acceptCall = () => {
    setActiveCall({ id: incomingCall.sender_id, name: incomingCall.sender_name });
    setIncomingCall(null);
  };

  return (
    <CallContext.Provider value={{ initiateCall, incomingCall, setIncomingCall }}>
      {children}
      
      {incomingCall && (
        <div className="fixed bottom-8 right-8 z-[100] bg-sc-panel border-2 border-sc-blue shadow-[0_0_30px_rgba(102,252,241,0.2)] rounded-lg p-6 w-80 animate-in fade-in slide-in-from-bottom-10 duration-500">
            <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-sc-blue/20 flex items-center justify-center animate-bounce">
                    <Phone className="w-6 h-6 text-sc-blue" />
                </div>
                <button onClick={() => setIncomingCall(null)} className="text-sc-grey/40 hover:text-white">
                    <X className="w-4 h-4" />
                </button>
            </div>
            
            <div className="mb-6">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Incoming Signal</h3>
                <p className="text-[10px] text-sc-blue font-mono mt-1 uppercase">FROM: {incomingCall.sender_name}</p>
            </div>
            
            <div className="flex space-x-3">
                <button 
                    onClick={acceptCall}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all"
                >
                    Establish
                </button>
                <button 
                    onClick={() => setIncomingCall(null)}
                    className="flex-1 bg-red-500/20 border border-red-500/50 text-red-500 py-2 rounded text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                >
                    Refuse
                </button>
            </div>
        </div>
      )}

      {activeCall && (
        <CallOverlay 
          localStream={localStream} 
          peers={peers} 
          onClose={() => setActiveCall(null)} 
          title={`Direct Link: ${activeCall.name}`} 
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          isScreenSharing={isScreenSharing}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
        />
      )}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within CallProvider');
  return context;
};
