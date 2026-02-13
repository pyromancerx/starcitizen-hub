'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Shield, 
  ChevronRight, 
  Plus,
  Clock,
  MapPin,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function OperationsPage() {
  const { data: operations, isLoading } = useQuery({
    queryKey: ['operations'],
    queryFn: async () => {
      const res = await api.get('/operations/');
      return res.data;
    },
  });

  const formatDate = (dateString: string, part: 'month' | 'day' | 'time') => {
    const date = new Date(dateString);
    if (part === 'month') return date.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
    if (part === 'day') return date.toLocaleDateString(undefined, { day: 'numeric' });
    if (part === 'time') return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return '';
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Operations Console
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Active Combat & Logistics Deployment
          </p>
        </div>
        <button className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Authorize Operation
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="p-24 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Shield className="w-12 h-12 text-sc-blue opacity-20 animate-pulse" />
                <div className="absolute inset-0 border-2 border-sc-blue rounded-full animate-ping opacity-10"></div>
              </div>
              <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic font-mono">Scanning mission parameters...</span>
            </div>
          </div>
        ) : operations?.length > 0 ? (
          operations.map((op: any) => (
            <div 
              key={op.id} 
              className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden flex flex-col md:flex-row group hover:border-sc-blue/30 transition-all duration-300 shadow-xl"
            >
              {/* Date Badge */}
              <div className="md:w-32 bg-sc-dark border-r border-sc-grey/5 p-6 flex flex-col items-center justify-center space-y-1 group-hover:bg-black/40 transition-colors">
                <span className="text-[10px] text-sc-blue font-black tracking-widest">{formatDate(op.scheduled_at, 'month')}</span>
                <span className="text-4xl font-bold text-white leading-none">{formatDate(op.scheduled_at, 'day')}</span>
                <span className="text-[8px] text-sc-grey/30 font-mono mt-2 uppercase">{formatDate(op.scheduled_at, 'time')}</span>
              </div>

              {/* Info Area */}
              <div className="flex-1 p-6 flex flex-col justify-center min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="px-2 py-0.5 bg-sc-blue/5 border border-sc-blue/20 rounded text-[9px] font-black uppercase text-sc-blue tracking-widest">
                    {op.type}
                  </span>
                  <div className="flex items-center text-[10px] text-sc-grey/40 font-bold uppercase tracking-widest">
                    <Clock className="w-3 h-3 mr-1.5 opacity-50" />
                    Status: <span className="text-sc-grey/80 ml-1">{op.status}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight truncate mb-2 italic">
                  {op.title}
                </h3>
                <div className="flex items-center space-x-6 text-[10px] text-sc-grey/40 font-black uppercase tracking-widest">
                  <span className="flex items-center">
                    <Users className="w-3 h-3 mr-1.5 text-sc-blue/50" />
                    {op.participants?.length || 0} / {op.max_participants || '∞'} Crew
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 mr-1.5 text-sc-blue/50" />
                    Stanton Sector
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 bg-black/20 md:w-48 flex items-center justify-center">
                <Link 
                  href={`/operations/mission?id=${op.id}`}
                  className="w-full py-2.5 border border-sc-blue/30 text-sc-blue text-[10px] font-black uppercase tracking-[0.2em] rounded text-center hover:bg-sc-blue hover:text-sc-dark transition-all duration-300 shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.05)]"
                >
                  Mission Intel
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-sc-panel border border-sc-grey/10 p-24 text-center rounded">
            <p className="text-sc-grey/30 uppercase tracking-[0.3em] text-sm italic">All sectors currently dark. No active operations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
