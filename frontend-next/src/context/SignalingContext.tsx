'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';

interface SignalingContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  error: string | null;
  send: (msg: any) => void;
  subscribe: (handler: (msg: any) => void) => () => void;
}

const SignalingContext = createContext<SignalingContextType | undefined>(undefined);

export const SignalingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handlersRef = useRef<Set<(msg: any) => void>>(new Set());

  useEffect(() => {
    if (!user) {
      if (socket) socket.close();
      return;
    }

    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = process.env.NEXT_PUBLIC_API_URL 
        ? process.env.NEXT_PUBLIC_API_URL.replace(/^http/, 'ws') 
        : `${protocol}//${window.location.host}/api`;
      
      const token = localStorage.getItem('token');
      const ws = new WebSocket(`${host}/social/signaling?token=${token}`);

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log("Signaling Matrix: LINK ESTABLISHED");
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log("Signaling Matrix: LINK SEVERED. Re-acquiring signal...");
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        setError('Signal interference detected.');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handlersRef.current.forEach(handler => handler(data));
      };

      setSocket(ws);
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, [user]);

  const send = (msg: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(msg));
    }
  };

  const subscribe = (handler: (msg: any) => void) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  };

  return (
    <SignalingContext.Provider value={{ socket, isConnected, error, send, subscribe }}>
      {children}
    </SignalingContext.Provider>
  );
};

export const useSignaling = () => {
  const context = useContext(SignalingContext);
  if (!context) throw new Error('useSignaling must be used within SignalingProvider');
  return context;
};
