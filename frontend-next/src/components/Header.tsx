'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User as UserIcon, ChevronDown, LogOut, Book, User as UserCircle, Rocket, Shield, MessageSquare } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { cn, useIsMounted, formatDate } from '@/lib/utils';

const Header = () => {
  const isMounted = useIsMounted();
  const { settings } = useThemeStore();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['global-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const res = await api.get(`/search?q=${searchQuery}`);
      return res.data.results || [];
    },
    enabled: searchQuery.length >= 2,
  });

  const { data: notifications, refetch: refetchNotifs } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications/');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => refetchNotifs(),
  });

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.is_read).length : 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-sc-panel border-b border-sc-grey/10 h-16 flex items-center justify-between px-8 shadow-2xl z-20 sticky top-0">
      <div className="md:hidden flex items-center space-x-2">
        {settings.logo_url && (
          <img src={settings.logo_url} className="h-6 w-6 object-contain" alt="Logo" />
        )}
        <span className="text-xl font-bold text-sc-blue uppercase">{settings.org_name}</span>
      </div>

      <div className="hidden md:flex items-center flex-1 max-w-md mx-8 relative" ref={searchRef}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-sc-grey/40" />
        </div>
        <input 
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearch(true);
          }}
          onFocus={() => setShowSearch(true)}
          type="text" 
          placeholder="Search Hub..." 
          className="bg-sc-dark/50 border border-sc-grey/10 rounded w-full py-1.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all placeholder-sc-grey/20"
        />

        {showSearch && searchQuery.length > 1 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-sc-panel border border-sc-blue/20 rounded shadow-2xl py-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 pb-2 mb-2 border-b border-white/5 flex justify-between items-center">
                    <span className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Global Tactical Search</span>
                    {searching && <div className="w-1 h-1 bg-sc-blue rounded-full animate-ping"></div>}
                </div>

                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {Array.isArray(searchResults) && searchResults.map((res: any, idx: number) => (
                        <Link 
                            key={idx} 
                            href={res.link} 
                            onClick={() => setShowSearch(false)}
                            className="flex items-center space-x-4 px-4 py-2 hover:bg-sc-blue/5 group transition-all"
                        >
                            <div className="h-8 w-8 rounded bg-sc-dark border border-white/5 flex items-center justify-center text-sc-grey/40 group-hover:text-sc-blue transition-colors">
                                {res.type === 'Citizen' && <UserCircle className="w-4 h-4" />}
                                {res.type === 'Vessel' && <Rocket className="w-4 h-4" />}
                                {res.type === 'Operation' && <Shield className="w-4 h-4" />}
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-sc-blue transition-colors">{res.title}</div>
                                <div className="text-[8px] text-sc-grey/40 uppercase font-mono">{res.type} • {res.sub}</div>
                            </div>
                        </Link>
                    ))}

                    {(!searchResults || (Array.isArray(searchResults) && searchResults.length === 0)) && !searching && (
                        <div className="p-8 text-center text-sc-grey/20 uppercase text-[9px] font-black italic">
                            No matching signals found in databank.
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      <div className="flex items-center space-x-6 ml-auto">
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
                "text-sc-grey/40 hover:text-sc-blue transition-colors relative flex items-center",
                unreadCount > 0 && "text-sc-blue"
            )}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-sc-blue text-black text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-black shadow-[0_0_8px_rgba(var(--color-sc-blue-rgb),0.5)]">
                    {unreadCount}
                </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-sc-panel border border-sc-blue/20 rounded shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 bg-black/40 border-b border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Neural Alerts</span>
                    <button className="text-[8px] font-black text-sc-blue/40 hover:text-sc-blue uppercase tracking-tighter transition-colors">Clear Stream</button>
                </div>
                
                <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-white/5">
                    {Array.isArray(notifications) && notifications.slice(0, 10).map((n: any) => (
                        <div key={n.id} className={cn(
                            "p-4 space-y-1 transition-all",
                            !n.is_read ? "bg-sc-blue/[0.03]" : "opacity-60"
                        )}>
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-white uppercase tracking-tight">{n.title}</span>
                                {!n.is_read && <div className="w-1 h-1 rounded-full bg-sc-blue animate-pulse mt-1"></div>}
                            </div>
                            <p className="text-[9px] text-sc-grey/60 leading-relaxed uppercase font-medium">{n.message}</p>
                            <div className="pt-2 flex justify-between items-center">
                                <span className="text-[7px] text-sc-grey/40 font-mono">{isMounted ? formatDate(n.created_at) : '---'}</span>
                                <div className="flex space-x-3">
                                    <Link href={n.link || '#'} onClick={() => setShowNotifications(false)} className="text-[7px] font-black text-sc-blue uppercase tracking-widest hover:text-white">Link</Link>
                                    {!n.is_read && <button onClick={() => markReadMutation.mutate(n.id)} className="text-[7px] font-black text-sc-grey/40 uppercase tracking-widest hover:text-white">Acknowledge</button>}
                                </div>
                            </div>
                        </div>
                    ))}
                    {(!notifications || (Array.isArray(notifications) && notifications.length === 0)) && (
                        <div className="p-12 text-center text-sc-grey/20 uppercase text-[9px] font-black italic">
                            All sectors currently secure. No active alerts.
                        </div>
                    )}
                </div>
            </div>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white uppercase tracking-tight">
                {user?.display_name || 'Citizen Pilot'}
              </div>
              <div className="text-[8px] text-sc-blue font-black uppercase tracking-widest">
                Verified Signal
              </div>
            </div>
            <div className="h-10 w-10 rounded bg-sc-panel border border-sc-blue/30 flex items-center justify-center text-sc-blue shadow-[0_0_10px_rgba(var(--color-sc-blue-rgb),0.2)]">
              <UserIcon className="w-6 h-6" />
            </div>
            <ChevronDown className={cn("w-3 h-3 text-sc-grey/40 transition-transform", showDropdown && "rotate-180")} />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-sc-panel border border-sc-blue/20 rounded shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-2 border-b border-white/5 mb-2">
                <p className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Authorized Session</p>
                <p className="text-[10px] font-bold text-white truncate uppercase">{user?.email}</p>
              </div>
              
              <Link 
                href="/profile" 
                onClick={() => setShowDropdown(false)}
                className="flex items-center space-x-3 px-4 py-2 text-[10px] font-black text-sc-grey/60 hover:text-sc-blue hover:bg-sc-blue/5 uppercase tracking-widest transition-all"
              >
                <UserCircle className="w-4 h-4" />
                <span>My Citizen Profile</span>
              </Link>

              <Link 
                href="/help" 
                onClick={() => setShowDropdown(false)}
                className="flex items-center space-x-3 px-4 py-2 text-[10px] font-black text-sc-grey/60 hover:text-sc-blue hover:bg-sc-blue/5 uppercase tracking-widest transition-all"
              >
                <Book className="w-4 h-4" />
                <span>Operations Manual</span>
              </Link>

              <div className="border-t border-white/5 mt-2 pt-2">
                <button 
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-[10px] font-black text-red-400/60 hover:text-red-400 hover:bg-red-400/5 uppercase tracking-widest transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Terminate Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
