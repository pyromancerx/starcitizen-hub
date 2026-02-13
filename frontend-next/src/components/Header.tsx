'use client';

import React, { useState } from 'react';
import { Search, Bell, User as UserIcon } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

const Header = () => {
  const { settings } = useThemeStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

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
          {/* <span className="absolute -top-1 -right-1 bg-sc-blue text-black text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">3</span> */}
        </button>

        <Link href="/profile" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
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
        </Link>
      </div>
    </header>
  );
};

export default Header;
