import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

interface Peer {
  id: number;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export const useWebRTC = (roomId?: string, targetId?: number) => {
  const { user } = useAuthStore();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<number, Peer>>(new Map());
  const [roomPresence, setRoomPresence] = useState<Map<string, number[]>>(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const socketRef = useRef<WebSocket | null>(null);
  const peersRef = useRef<Map<number, Peer>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  const iceServers = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };

  const createPeerConnection = useCallback((peerId: number) => {
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          target_id: peerId,
          room_id: roomId,
        }));
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

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
    }

    return pc;
  }, [roomId]);

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

  useEffect(() => {
    const initMedia = async () => {
      try {
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
  }, []);

  useEffect(() => {
    if (!user) return;

    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
        setConnectionStatus('connecting');
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = process.env.NEXT_PUBLIC_API_URL 
          ? process.env.NEXT_PUBLIC_API_URL.replace(/^http/, 'ws') 
          : `${protocol}//${window.location.host}/api`;
        
        const token = localStorage.getItem('token');
        const ws = new WebSocket(`${host}/social/signaling?token=${token}`);
        socketRef.current = ws;

        ws.onopen = () => {
          setConnectionStatus('connected');
          setError(null);
          if (roomId) {
            ws.send(JSON.stringify({ type: 'join', room_id: roomId }));
          }
        };

        ws.onclose = () => {
          setConnectionStatus('disconnected');
          // Auto reconnect after 3 seconds
          reconnectTimer = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          setConnectionStatus('error');
          setError('Signaling link failed. Re-establishing connection...');
        };

        ws.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          const { type, sender_id, offer, answer, candidate } = data;

          if (type === 'user-joined') {
            // Create offer to new user
            const pc = createPeerConnection(sender_id);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ws.send(JSON.stringify({ type: 'offer', offer, target_id: sender_id, room_id: roomId }));
            peersRef.current.set(sender_id, { id: sender_id, connection: pc });
          } else if (type === 'offer') {
            const pc = createPeerConnection(sender_id);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'answer', answer, target_id: sender_id, room_id: roomId }));
            peersRef.current.set(sender_id, { id: sender_id, connection: pc });
          } else if (type === 'answer') {
            const peer = peersRef.current.get(sender_id);
            if (peer) {
              await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
            }
          } else if (type === 'ice-candidate') {
            const peer = peersRef.current.get(sender_id);
            if (peer) {
              await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
            }
          } else if (type === 'user-left') {
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
        };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      socketRef.current?.close();
      peersRef.current.forEach(peer => peer.connection.close());
    };
  }, [user, roomId, createPeerConnection]);

  return { 
    localStream, 
    peers, 
    roomPresence,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    error,
    connectionStatus,
    socketRef,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare
  };
};
