'use client';

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { 
  User as UserIcon, 
  ShieldCheck, 
  MapPin, 
  Rocket, 
  Calendar,
  Lock,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuthStore();

  const profileStats = [
    { label: 'Fleet Assets', value: '12 Vessels', icon: Rocket },
    { label: 'Rank Tier', value: 'Officer', icon: ShieldCheck },
    { label: 'Hub Longevity', value: '42 Cycles', icon: Calendar },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-sc-panel border border-sc-blue/20 rounded-lg overflow-hidden shadow-2xl relative">
        <div className="h-32 bg-gradient-to-r from-sc-dark to-sc-panel relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-sc-panel to-transparent"></div>
        </div>
        
        <div className="px-8 pb-8 flex flex-col md:flex-row items-end -mt-12 relative z-10 space-y-4 md:space-y-0 md:space-x-6">
          <div className="h-32 w-32 rounded bg-sc-dark border-4 border-sc-panel shadow-2xl flex items-center justify-center text-sc-blue relative group">
            <UserIcon className="w-16 h-16" />
            <button className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit3 className="w-6 h-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 space-y-1 text-center md:text-left">
            <h2 className="text-3xl font-bold text-white uppercase italic tracking-tight">{user?.display_name || 'Citizen Pilot'}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-black text-sc-grey/40 uppercase tracking-widest">
              <span className="flex items-center text-sc-blue">
                <ShieldCheck className="w-3 h-3 mr-1.5" />
                {user?.rsi_handle || 'ADMIN_CORE'}
              </span>
              <span className="flex items-center">
                <MapPin className="w-3 h-3 mr-1.5" />
                Stanton Sector
              </span>
              <span className="flex items-center">
                <Lock className="w-3 h-3 mr-1.5 text-green-500" />
                Biometric Match
              </span>
            </div>
          </div>

          <button className="px-6 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-black uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            Edit Bio
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {profileStats.map((stat) => (
          <div key={stat.label} className="bg-sc-panel border border-sc-grey/10 p-6 rounded text-center space-y-2">
            <stat.icon className="w-6 h-6 text-sc-blue/40 mx-auto" />
            <div className="text-[8px] font-black text-sc-grey/30 uppercase tracking-[0.2em]">{stat.label}</div>
            <div className="text-lg font-bold text-white italic">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Profile Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xs font-black text-sc-blue uppercase tracking-[0.3em] border-b border-sc-blue/20 pb-2">Service Record</h3>
          <div className="bg-sc-panel border border-sc-grey/10 rounded p-6 space-y-4">
            <p className="text-xs text-sc-grey/60 italic leading-relaxed">
              "No biography data available in the primary databank. Citizen has not yet provided personal history logs for public record."
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-sc-blue uppercase tracking-[0.3em] border-b border-sc-blue/20 pb-2">Assigned Roles</h3>
          <div className="flex flex-wrap gap-2">
            {user?.roles?.map((role: any) => (
              <div key={role.id} className="px-4 py-2 bg-sc-dark border border-sc-blue/30 rounded text-[10px] font-bold text-sc-blue uppercase tracking-widest shadow-[0_0_10px_rgba(var(--color-sc-blue-rgb),0.1)]">
                {role.name}
              </div>
            ))}
            {(!user?.roles || user.roles.length === 0) && (
              <div className="text-[10px] text-sc-grey/30 uppercase italic">No command roles assigned.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
