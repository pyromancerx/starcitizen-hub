'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { 
  User as UserIcon, 
  ShieldCheck, 
  MapPin, 
  Rocket, 
  Calendar,
  Lock,
  Edit3,
  Mail,
  Bell,
  MessageCircle,
  RefreshCw,
  Fingerprint,
  CheckCircle2,
  Clock as ClockIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [rsiHandle, setRsiHandle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditEditForm] = useState({
    display_name: '',
    biography: '',
    avatar_url: ''
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile-me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    }
  });

  React.useEffect(() => {
    if (profile) {
        setEditEditForm({
            display_name: profile.display_name,
            biography: profile.biography || '',
            avatar_url: profile.avatar_url || ''
        });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.patch('/auth/me', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-me'] });
      setIsEditing(false);
    }
  });

  const submitVerifyMutation = useMutation({
    mutationFn: async () => {
      return api.post('/social/rsi-verify', { rsi_handle: rsiHandle, screenshot_url: 'MANUAL_VERIFY' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-me'] });
      alert('Verification request submitted to Command.');
    }
  });

  const updatePrefsMutation = useMutation({
    mutationFn: async (settings: any) => {
      return api.patch('/admin/users/me/notifications', { notification_settings: JSON.stringify(settings) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-me'] });
    }
  });

  const prefs = profile?.notification_settings ? JSON.parse(profile.notification_settings) : {
    announcements: { email: true, discord: false, in_app: true },
    messages: { email: false, discord: false, in_app: true }
  };

  const handleToggle = (category: string, channel: string) => {
    const newPrefs = { ...prefs };
    newPrefs[category][channel] = !newPrefs[category][channel];
    updatePrefsMutation.mutate(newPrefs);
  };

  const profileStats = [
    { label: 'Fleet Assets', value: '12 Vessels', icon: Rocket },
    { label: 'Rank Tier', value: profile?.roles?.[0]?.name || 'Citizen', icon: ShieldCheck },
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
            {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" /> : <UserIcon className="w-16 h-16" />}
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Edit3 className="w-6 h-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 space-y-1 text-center md:text-left">
            {isEditing ? (
                <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-sc-blue uppercase tracking-widest">Citizen Designation</label>
                      <input 
                          value={editForm.display_name}
                          onChange={e => setEditEditForm({...editForm, display_name: e.target.value})}
                          className="text-2xl font-bold bg-black/40 border border-sc-blue/30 text-white uppercase italic tracking-tight rounded px-3 py-1 w-full max-w-md focus:outline-none focus:border-sc-blue transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-sc-blue uppercase tracking-widest">Avatar Image Link</label>
                      <input 
                          value={editForm.avatar_url}
                          onChange={e => setEditEditForm({...editForm, avatar_url: e.target.value})}
                          placeholder="https://example.com/image.png"
                          className="text-xs bg-black/40 border border-sc-blue/30 text-white font-mono rounded px-3 py-1.5 w-full max-w-md focus:outline-none focus:border-sc-blue transition-all"
                      />
                    </div>
                </div>
            ) : (
                <h2 className="text-3xl font-bold text-white uppercase italic tracking-tight">{profile?.display_name || user?.display_name || 'Citizen Pilot'}</h2>
            )}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-black text-sc-grey/40 uppercase tracking-widest">
              <span className="flex items-center text-sc-blue">
                <ShieldCheck className="w-3 h-3 mr-1.5" />
                {profile?.rsi_handle || user?.rsi_handle || 'ADMIN_CORE'}
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

          {isEditing ? (
            <div className="flex space-x-2">
                <button 
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 text-sc-grey/40 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
                >
                    Cancel
                </button>
                <button 
                    onClick={() => updateProfileMutation.mutate(editForm)}
                    disabled={updateProfileMutation.isPending}
                    className="px-6 py-2 bg-sc-blue text-sc-dark text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all rounded shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.3)]"
                >
                    {updateProfileMutation.isPending ? 'Syncing...' : 'Save Record'}
                </button>
            </div>
          ) : (
            <button 
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-black uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded"
            >
                Edit Dossier
            </button>
          )}
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
            {isEditing ? (
                <div className="space-y-2">
                    <label className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Public Biography</label>
                    <textarea 
                        value={editForm.biography}
                        onChange={e => setEditEditForm({...editForm, biography: e.target.value})}
                        rows={6}
                        className="w-full bg-black/40 border border-sc-blue/30 rounded p-4 text-xs text-sc-grey font-medium focus:outline-none focus:border-sc-blue custom-scrollbar italic"
                        placeholder="Enter your service record history..."
                    />
                </div>
            ) : (
                <p className="text-xs text-sc-grey/60 italic leading-relaxed font-medium">
                "{profile?.biography || 'No biography data available in the primary databank. Citizen has not yet provided personal history logs for public record.'}"
                </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-sc-blue uppercase tracking-[0.3em] border-b border-sc-blue/20 pb-2">Assigned Roles</h3>
          <div className="flex flex-wrap gap-2">
            {profile?.roles?.map((role: any) => (
              <div key={role.id} className="px-4 py-2 bg-sc-dark border border-sc-blue/30 rounded text-[10px] font-bold text-sc-blue uppercase tracking-widest shadow-[0_0_10px_rgba(var(--color-sc-blue-rgb),0.1)]">
                {role.name}
              </div>
            ))}
            {(!profile?.roles || profile.roles.length === 0) && (
              <div className="text-[10px] text-sc-grey/30 uppercase italic">No command roles assigned.</div>
            )}
          </div>
        </div>
      </div>

      {/* RSI Identity Matching */}
      <div className="space-y-4 mt-8">
        <h3 className="text-xs font-black text-sc-blue uppercase tracking-[0.3em] border-b border-sc-blue/20 pb-2">RSI Identity Matching</h3>
        <div className="bg-sc-panel border border-sc-grey/10 rounded-lg p-8 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Fingerprint className="w-24 h-24 text-sc-blue" />
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                {profile?.is_rsi_verified ? (
                    <div className="flex-1 space-y-4 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start space-x-3 text-green-500">
                            <CheckCircle2 className="w-6 h-6" />
                            <h4 className="text-lg font-black uppercase tracking-widest italic">Matched & Authorized</h4>
                        </div>
                        <p className="text-[10px] text-sc-grey/60 uppercase font-bold tracking-widest leading-relaxed max-w-lg">
                            Your institutional record has been cryptographically matched with RSI citizen <span className="text-sc-blue">{profile.rsi_handle}</span>. High-clearance tactical data is now accessible.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center space-x-3 text-sc-blue">
                                <ClockIcon className="w-6 h-6 animate-pulse" />
                                <h4 className="text-lg font-black uppercase tracking-widest italic">Authorization Required</h4>
                            </div>
                            <p className="text-[10px] text-sc-grey/60 uppercase font-bold tracking-widest leading-relaxed">
                                Prove your RSI identity to synchronize with organization assets. Submit your official RSI handle below for command verification.
                            </p>
                            <div className="flex items-center space-x-3">
                                <input 
                                    value={rsiHandle}
                                    onChange={(e) => setRsiHandle(e.target.value)}
                                    placeholder="RSI Citizen Handle..."
                                    className="bg-black/40 border border-white/10 rounded px-4 py-2 text-xs text-white focus:border-sc-blue/50 outline-none w-64"
                                />
                                <button 
                                    onClick={() => submitVerifyMutation.mutate()}
                                    disabled={submitVerifyMutation.isPending || !rsiHandle}
                                    className="px-6 py-2 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:bg-white transition-all disabled:opacity-20"
                                >
                                    {submitVerifyMutation.isPending ? 'Syncing...' : 'Request Match'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>

      {/* Comms Preferences */}
      <div className="space-y-4 mt-8">
        <h3 className="text-xs font-black text-sc-blue uppercase tracking-[0.3em] border-b border-sc-blue/20 pb-2">Communication & Alerts</h3>
        <div className="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
                {/* Announcements */}
                <div className="p-6 space-y-6">
                    <div className="flex items-center space-x-3 mb-2">
                        <Bell className="w-4 h-4 text-sc-blue" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Organization Announcements</span>
                    </div>
                    <div className="space-y-4">
                        <PreferenceToggle 
                            label="Sub-Space Transmission (Email)" 
                            active={prefs.announcements.email} 
                            onClick={() => handleToggle('announcements', 'email')}
                            loading={updatePrefsMutation.isPending}
                        />
                        <PreferenceToggle 
                            label="In-App HUD Alerts" 
                            active={prefs.announcements.in_app} 
                            onClick={() => handleToggle('announcements', 'in_app')}
                            loading={updatePrefsMutation.isPending}
                        />
                        <PreferenceToggle 
                            label="Discord Relay" 
                            active={prefs.announcements.discord} 
                            onClick={() => handleToggle('announcements', 'discord')}
                            loading={updatePrefsMutation.isPending}
                        />
                    </div>
                </div>

                {/* Messages */}
                <div className="p-6 space-y-6">
                    <div className="flex items-center space-x-3 mb-2">
                        <MessageCircle className="w-4 h-4 text-sc-blue" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Personal Frequencies (DMs)</span>
                    </div>
                    <div className="space-y-4">
                        <PreferenceToggle 
                            label="Offline Email Alerts" 
                            active={prefs.messages.email} 
                            onClick={() => handleToggle('messages', 'email')}
                            loading={updatePrefsMutation.isPending}
                        />
                        <PreferenceToggle 
                            label="Desktop Notifications" 
                            active={prefs.messages.in_app} 
                            onClick={() => handleToggle('messages', 'in_app')}
                            loading={updatePrefsMutation.isPending}
                        />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

const PreferenceToggle = ({ label, active, onClick, loading }: { label: string, active: boolean, onClick: () => void, loading: boolean }) => (
    <div className="flex items-center justify-between group">
        <span className="text-[10px] font-bold text-sc-grey/60 uppercase tracking-widest">{label}</span>
        <button 
            onClick={onClick}
            disabled={loading}
            className={cn(
                "relative w-10 h-5 rounded-full transition-all duration-300 border",
                active ? "bg-sc-blue/20 border-sc-blue shadow-[0_0_10px_rgba(var(--color-sc-blue-rgb),0.2)]" : "bg-black/40 border-sc-grey/20"
            )}
        >
            <div className={cn(
                "absolute top-1 left-1 w-2.5 h-2.5 rounded-full transition-all duration-300",
                active ? "translate-x-5 bg-sc-blue" : "bg-sc-grey/40"
            )}></div>
        </button>
    </div>
);
