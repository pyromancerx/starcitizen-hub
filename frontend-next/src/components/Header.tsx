'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User as UserIcon, ChevronDown, LogOut, Book, User as UserCircle } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const Header = () => {
  const { settings } = useThemeStore();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
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

      <div className="hidden md:flex items-center flex-1 max-w-md mx-8 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-sc-grey/40" />
        </div>
        <input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          type="text" 
          placeholder="Search Hub..." 
          className="bg-sc-dark/50 border border-sc-grey/10 rounded w-full py-1.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all placeholder-sc-grey/20"
        />
      </div>

      <div className="flex items-center space-x-6 ml-auto">
        <button className="text-sc-grey/40 hover:text-sc-blue transition-colors relative">
          <Bell className="w-5 h-5" />
        </button>

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
