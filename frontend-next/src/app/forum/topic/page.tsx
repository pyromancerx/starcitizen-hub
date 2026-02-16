'use client';

import React, { Suspense, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Clock,
  ChevronRight,
  Shield,
  Zap,
  Send,
  Cpu,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

function TopicContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [replyContent, setReplyContent] = useState('');

  const { data: thread, isLoading } = useQuery({
    queryKey: ['forum-thread', id],
    queryFn: async () => {
      const res = await api.get(`/forum/threads/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      return api.post('/forum/posts', {
        thread_id: Number(id),
        content
      });
    },
    onSuccess: () => {
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['forum-thread', id] });
    }
  });

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyContent.trim()) {
      replyMutation.mutate(replyContent);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href={`/forum/channel?id=${thread?.category_id || ''}`} className="p-2 hover:bg-white/5 rounded text-sc-blue transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white uppercase tracking-widest italic">{isLoading ? 'Decrypting Transmission...' : thread?.title}</h2>
          <div className="flex items-center space-x-3">
            <span className="text-[8px] font-black text-sc-blue uppercase tracking-widest px-2 py-0.5 bg-sc-blue/10 border border-sc-blue/20 rounded">Topic ID: {id}</span>
            <span className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Encryption: AES-256-HUD</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Original Post */}
        {thread && (
            <PostCard 
                author={thread.author} 
                content={thread.posts?.[0]?.content || 'Signal lost...'} 
                date={thread.created_at}
                isOP
            />
        )}

        {/* Replies */}
        {thread?.posts?.slice(1).map((post: any) => (
            <PostCard 
                key={post.id}
                author={post.author}
                content={post.content}
                date={post.created_at}
            />
        ))}

        {/* Reply Area */}
        <div className="bg-sc-panel border border-sc-blue/20 rounded-lg overflow-hidden shadow-2xl mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 bg-black/40 border-b border-sc-blue/10 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <MessageSquare className="w-4 h-4 text-sc-blue" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Encode Response</span>
                </div>
                <span className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest italic">Signal Pulse: Stable</span>
            </div>
            <form onSubmit={handleReply} className="p-6 space-y-4">
                <textarea 
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={4}
                    placeholder="Input tactical response..."
                    className="w-full bg-sc-dark/50 border border-sc-grey/20 rounded p-4 text-sm text-white focus:border-sc-blue/50 outline-none transition-all resize-none font-mono"
                />
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4 opacity-40">
                        <Shield className="w-4 h-4 text-sc-blue" />
                        <Zap className="w-4 h-4 text-sc-blue" />
                        <Cpu className="w-4 h-4 text-sc-blue" />
                    </div>
                    <button 
                        type="submit"
                        disabled={!replyContent.trim() || replyMutation.isPending}
                        className="px-8 py-2 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all flex items-center space-x-2 disabled:opacity-20"
                    >
                        <Send className="w-3 h-3" />
                        <span>{replyMutation.isPending ? 'Broadcasting...' : 'Authorize Transmission'}</span>
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}

const PostCard = ({ author, content, date, isOP }: { author: any, content: string, date: string, isOP?: boolean }) => (
    <div className={cn(
        "flex space-x-6 animate-in fade-in slide-in-from-bottom-2 duration-500",
        isOP ? "bg-sc-panel/40 border border-sc-blue/10 p-8 rounded-lg" : "p-6"
    )}>
        <div className="flex flex-col items-center space-y-3 w-24 flex-shrink-0">
            <div className={cn(
                "h-16 w-16 rounded bg-sc-dark border flex items-center justify-center relative",
                isOP ? "border-sc-blue/30 text-sc-blue shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.1)]" : "border-white/5 text-sc-grey/40"
            )}>
                <UserIcon className="w-8 h-8" />
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-sc-panel flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></div>
                </div>
            </div>
            <div className="text-center space-y-1">
                <div className="text-[10px] font-black text-white uppercase tracking-tighter truncate w-full">{author?.display_name || 'Pilot'}</div>
                <div className="text-[7px] font-black text-sc-blue uppercase tracking-widest bg-sc-blue/5 border border-sc-blue/20 rounded-full px-1.5 py-0.5">Verified</div>
            </div>
        </div>

        <div className="flex-1 space-y-4 min-w-0">
            <div className="flex justify-between items-center text-[8px] font-black text-sc-grey/40 uppercase tracking-[0.2em] border-b border-white/5 pb-2">
                <span>Signal Intercept: {new Date(date).toLocaleString()}</span>
                <span>Relay node: STANTON-CORE-01</span>
            </div>
            <p className="text-sm text-sc-grey/80 leading-relaxed font-medium">
                {content}
            </p>
            {!isOP && (
                <div className="flex space-x-4 pt-2">
                    <button 
                        onClick={() => alert('Transmission acknowledged. Signal strength remains optimal.')}
                        className="text-[8px] font-black text-sc-blue/40 uppercase hover:text-sc-blue transition-colors"
                    >
                        Acknowledge
                    </button>
                    <button 
                        onClick={() => alert('Relaying transmission to secondary Spectrum nodes... [Relay Placeholder]')}
                        className="text-[8px] font-black text-sc-blue/40 uppercase hover:text-sc-blue transition-colors"
                    >
                        Relay
                    </button>
                </div>
            )}
        </div>
    </div>
);

export default function TopicPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center uppercase font-black text-sc-blue animate-pulse tracking-[0.5em]">Establishing Neural Link...</div>}>
      <TopicContent />
    </Suspense>
  );
}
