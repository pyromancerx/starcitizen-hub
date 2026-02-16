'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Calendar, 
  ChevronRight, 
  Plus,
  Clock,
  MapPin,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function EventsPage() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await api.get('/operations/');
      return res.data;
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            Organization Events
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Synchronized Mission Timeline
          </p>
        </div>
        <button 
            onClick={() => alert('Chronometer synchronization failed: Event scheduling is currently restricted to high-clearance personnel.')}
            className="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Event
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="p-24 text-center">
            <div className="animate-pulse flex flex-col items-center space-y-4">
              <Calendar className="w-12 h-12 text-sc-blue opacity-20" />
              <span className="text-[10px] text-sc-grey/40 uppercase tracking-widest italic font-mono">Syncing chronometer...</span>
            </div>
          </div>
        ) : events?.length > 0 ? (
          events.map((event: any) => (
            <div 
              key={event.id} 
              className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden flex group hover:border-sc-blue/30 transition-all duration-300"
            >
              <div className="w-2 bg-sc-blue opacity-20 group-hover:opacity-100 transition-opacity"></div>
              <div className="p-6 flex-1 flex flex-col md:flex-row justify-between items-center">
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight italic">{event.title}</h3>
                  <div className="flex items-center space-x-6 text-[10px] text-sc-grey/40 font-black uppercase tracking-widest">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1.5 text-sc-blue/50" />
                      {new Date(event.scheduled_at).toLocaleString()}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-3 h-3 mr-1.5 text-sc-blue/50" />
                      {event.attendees?.length || 0} RSVPs
                    </span>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <button 
                    onClick={() => alert(`Accessing mission parameters for: ${event.title}... [Intel Placeholder]`)}
                    className="px-6 py-2 border border-sc-blue/30 text-sc-blue text-[10px] font-black uppercase tracking-widest rounded hover:bg-sc-blue/10 transition-all"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-sc-panel border border-sc-grey/10 p-24 text-center rounded">
            <p className="text-sc-grey/30 uppercase tracking-[0.3em] text-sm italic">No events recorded in current time-stream.</p>
          </div>
        )}
      </div>
    </div>
  );
}
