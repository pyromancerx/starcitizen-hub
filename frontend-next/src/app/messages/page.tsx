'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Send, 
  MessageSquare, 
  User as UserIcon,
  Search,
  MoreVertical,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useSignaling } from '@/context/SignalingContext';

import { useSearchParams } from 'next/navigation';

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const targetUserID = searchParams.get('user');
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  
  const { send, subscribe } = useSignaling();

  const { data: conversations, isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.get('/messages/conversations');
      return res.data;
    },
  });

  // Handle target user from query param
  useEffect(() => {
    if (targetUserID && conversations) {
        const id = parseInt(targetUserID);
        const existing = conversations.find((c: any) => c.user1_id === id || c.user2_id === id);
        if (existing) {
            setSelectedConv(existing);
        } else {
            // Create new conversation
            api.post('/messages/conversations', { target_id: id }).then(res => {
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
                setSelectedConv(res.data);
            });
        }
    }
  }, [targetUserID, conversations, queryClient]);

  const { data: messages, isLoading: msgsLoading } = useQuery({
    queryKey: ['messages', selectedConv?.id],
    queryFn: async () => {
      if (!selectedConv) return [];
      const res = await api.get(`/messages/conversations/${selectedConv.id}`);
      return res.data.messages;
    },
    enabled: !!selectedConv,
  });

  // Listen for real-time messages
  useEffect(() => {
    const unsubscribe = subscribe((data) => {
        if (data.type === 'direct-message' && data.conversation_id === selectedConv?.id) {
            queryClient.invalidateQueries({ queryKey: ['messages', selectedConv?.id] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
    });

    return () => unsubscribe();
  }, [subscribe, selectedConv, queryClient]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return api.post('/messages/', {
        conversation_id: selectedConv.id,
        content
      });
    },
    onSuccess: () => {
      const otherUser = selectedConv.user1_id === currentUser?.id ? selectedConv.user2 : selectedConv.user1;
      
      // Notify recipient via signaling matrix
      send({
          type: 'direct-message',
          target_id: otherUser.id,
          conversation_id: selectedConv.id
      });

      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConv?.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMessageMutation.mutate(messageText);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex bg-sc-panel border border-sc-grey/10 rounded overflow-hidden shadow-2xl">
      {/* Sidebar */}
      <div className="w-80 border-r border-sc-grey/10 flex flex-col bg-black/20">
        <div className="p-4 border-b border-sc-grey/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sc-grey/40" />
            <input 
              placeholder="Search frequencies..."
              className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded pl-9 pr-4 py-2 text-[10px] text-white focus:outline-none focus:border-sc-blue/50 uppercase tracking-widest font-bold"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-sc-grey/5">
          {convsLoading ? (
            <div className="p-8 text-center text-sc-grey/40 text-[10px] uppercase font-black italic">Scanning signals...</div>
          ) : conversations?.map((conv: any) => {
            const otherUser = conv.user1_id === currentUser?.id ? conv.user2 : conv.user1;
            const isActive = selectedConv?.id === conv.id;
            return (
              <button 
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={cn(
                  "w-full p-4 flex items-start space-x-3 transition-all text-left",
                  isActive ? "bg-sc-blue/5 border-l-2 border-sc-blue" : "hover:bg-white/5 border-l-2 border-transparent"
                )}
              >
                <div className="h-10 w-10 rounded bg-sc-dark border border-sc-grey/10 flex items-center justify-center text-sc-blue flex-shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-white uppercase truncate">{otherUser?.display_name}</span>
                    <span className="text-[8px] text-sc-grey/40 font-mono">{new Date(conv.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p className="text-[10px] text-sc-grey/60 truncate mt-1">
                    {conv.last_message_preview || 'New Link Established'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-sc-dark/30">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-sc-grey/10 bg-black/40 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded bg-sc-panel border border-sc-blue/20 flex items-center justify-center text-sc-blue">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-widest">
                    {(selectedConv.user1_id === currentUser?.id ? selectedConv.user2 : selectedConv.user1)?.display_name}
                  </div>
                  <div className="text-[8px] text-green-500 font-black uppercase tracking-widest flex items-center">
                    <div className="w-1 h-1 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                    Secure Link Active
                  </div>
                </div>
              </div>
              <MoreVertical className="w-4 h-4 text-sc-grey/40 cursor-pointer hover:text-white" />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {msgsLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-sc-blue"></div>
                </div>
              ) : messages?.map((msg: any) => {
                const isMine = msg.sender_id === currentUser?.id;
                return (
                  <div key={msg.id} className={cn(
                    "flex flex-col max-w-[70%]",
                    isMine ? "ml-auto items-end" : "mr-auto items-start"
                  )}>
                    <div className={cn(
                      "p-3 rounded text-xs leading-relaxed",
                      isMine 
                        ? "bg-sc-blue/10 border border-sc-blue/20 text-white rounded-br-none" 
                        : "bg-sc-panel border border-sc-grey/10 text-sc-grey rounded-bl-none"
                    )}>
                      {msg.content}
                    </div>
                    <span className="text-[8px] text-sc-grey/30 mt-1 font-mono uppercase">
                      {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • TRANSMISSION_SECURE
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-sc-grey/10 bg-black/40">
              <div className="relative flex items-center">
                <input 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Encode message..."
                  className="w-full bg-sc-dark border border-sc-grey/20 rounded pl-4 pr-12 py-3 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all"
                />
                <button 
                  type="submit"
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  className="absolute right-2 p-2 text-sc-blue hover:bg-sc-blue/10 rounded transition-all disabled:opacity-20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20">
            <MessageSquare className="w-16 h-16" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Select frequency to monitor</span>
          </div>
        )}
      </div>
    </div>
  );
}
