import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSignaling } from '@/context/SignalingContext';

interface Peer {
  id: number;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export const useWebRTC = (roomId?: string, shouldInitMedia: boolean = false) => {
  const { user } = useAuthStore();
  const { send, subscribe, isConnected } = useSignaling();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<number, Peer>>(new Map());
  const [roomPresence, setRoomPresence] = useState<Map<string, number[]>>(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const peersRef = useRef<Map<number, Peer>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const iceServers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  const createPeerConnection = useCallback((peerId: number) => {
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        send({
          type: 'ice-candidate',
          candidate: event.candidate,
          target_id: peerId,
          room_id: roomId,
        });
      }
    };

    pc.ontrack = (event) => {
      setPeers(prev => {
        const newPeers = new Map(prev);
        const peer = newPeers.get(peerId);
        if (peer) {
          peer.stream = event.streams[0];
        } else {
          newPeers.set(peerId, { id: peerId, connection: pc, stream: event.streams[0] });
        }
        return newPeers;
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with peer ${peerId}: ${pc.connectionState}`);
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        // Handle failed connection
      }
    };

    return pc;
  }, [roomId, send]);

  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = userStream.getVideoTracks()[0];

      if (localStreamRef.current) {
        const screenTrack = localStreamRef.current.getVideoTracks()[0];
        if (screenTrack) {
          localStreamRef.current.removeTrack(screenTrack);
          screenTrack.stop();
        }
        localStreamRef.current.addTrack(videoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

        peersRef.current.forEach((peer) => {
          const sender = peer.connection.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        setIsScreenSharing(false);
      }
    } catch (err) {
      console.error("Failed to restore camera:", err);
    }
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];

      if (localStreamRef.current) {
        // Replace video track in local stream
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          localStreamRef.current.removeTrack(videoTrack);
          videoTrack.stop();
        }
        localStreamRef.current.addTrack(screenTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks())); // Trigger re-render
        
        // Replace track in all peer connections
        peersRef.current.forEach((peer) => {
          const sender = peer.connection.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        setIsScreenSharing(true);

        // Handle stop sharing from browser UI
        screenTrack.onended = () => {
          stopScreenShare();
        };
      }
    } catch (err) {
      console.error("Failed to start screen share:", err);
    }
  }, [stopScreenShare]);

  useEffect(() => {
    if (!shouldInitMedia) return;

    const initMedia = async () => {
      try {
        if (!navigator.mediaDevices) {
            console.error("Media devices not supported in this context.");
            return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        localStreamRef.current = stream;
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    };
    initMedia();

    return () => {
      localStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, [shouldInitMedia]);

  useEffect(() => {
    if (!user || !roomId) return;

    if (isConnected) {
        setConnectionStatus('connected');
        send({ type: 'join', room_id: roomId });
    } else {
        setConnectionStatus('connecting');
    }

    const unsubscribe = subscribe(async (data) => {
        if (!data) return;
        const { type, sender_id, offer, answer, candidate } = data;

        if (type === 'user-joined' && sender_id) {
          const pc = createPeerConnection(sender_id);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          send({ type: 'offer', offer, target_id: sender_id, room_id: roomId });
          peersRef.current.set(sender_id, { id: sender_id, connection: pc });
        } else if (type === 'offer' && sender_id) {
          const pc = createPeerConnection(sender_id);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          send({ type: 'answer', answer, target_id: sender_id, room_id: roomId });
          peersRef.current.set(sender_id, { id: sender_id, connection: pc });
        } else if (type === 'answer' && sender_id) {
          const peer = peersRef.current.get(sender_id);
          if (peer) {
            await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
          }
        } else if (type === 'ice-candidate' && sender_id) {
          const peer = peersRef.current.get(sender_id);
          if (peer) {
            await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } else if (type === 'user-left' && sender_id) {
          const peer = peersRef.current.get(sender_id);
          if (peer) {
            peer.connection.close();
            peersRef.current.delete(sender_id);
            setPeers(prev => {
              const newPeers = new Map(prev);
              newPeers.delete(sender_id);
              return newPeers;
            });
          }
        } else if (type === 'room-presence') {
          setRoomPresence(prev => {
            const newPresence = new Map(prev);
            newPresence.set(data.room_id, data.user_ids);
            return newPresence;
          });
        }
    });

    return () => {
      unsubscribe();
      if (isConnected) {
          send({ type: 'leave', room_id: roomId });
      }
      peersRef.current.forEach(peer => peer.connection.close());
    };
  }, [user, roomId, createPeerConnection, send, subscribe, isConnected]);

  return { 
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
  };
};
