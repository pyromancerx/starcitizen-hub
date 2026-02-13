'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { 
  LayoutDashboard, 
  Rocket, 
  Package, 
  Wallet, 
  Database, 
  Calendar, 
  Users, 
  MessageSquare, 
  Trophy, 
  ShieldCheck, 
  Settings, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Sidebar = () => {
  const pathname = usePathname();
  const { settings } = useThemeStore();
  const { logout } = useAuthStore();

  const navGroups = [
    {
      label: 'Assets',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Fleet Registry', href: '/fleet', icon: Rocket },
        { name: 'Inventory', href: '/inventory', icon: Package },
        { name: 'Financials', href: '/wallet', icon: Wallet },
        { name: 'Org Stockpiles', href: '/stockpiles', icon: Database },
      ]
    },
    {
      label: 'Social',
      items: [
        { name: 'Operations', href: '/operations', icon: ShieldCheck },
        { name: 'Events', href: '/events', icon: Calendar },
        { name: 'Spectrum Forum', href: '/forum', icon: MessageSquare },
        { name: 'Personnel', href: '/members', icon: Users },
        { name: 'Messages', href: '/messages', icon: MessageSquare },
      ]
    },
    {
      label: 'Recognition',
      items: [
        { name: 'Achievements', href: '/achievements', icon: Trophy },
      ]
    },
    {
      label: 'Command',
      items: [
        { name: 'System Admin', href: '/admin', icon: Settings },
        { name: 'RSI Verification', href: '/admin/rsi-verification', icon: ShieldCheck },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-sc-panel border-r border-sc-grey/10 flex-shrink-0 hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-sc-grey/10 flex items-center space-x-3">
        {settings.logo_url && (
          <img src={settings.logo_url} className="h-8 w-8 object-contain" alt="Org Logo" />
        )}
        <h1 className="text-lg font-bold text-sc-blue tracking-widest uppercase truncate">
          {settings.org_name}
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <h3 className="text-[10px] font-black text-sc-grey/30 uppercase px-4 tracking-widest mb-2">
              {group.label}
            </h3>
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all duration-200 border-l-2",
                    isActive 
                      ? "bg-sc-blue/10 text-sc-blue border-sc-blue shadow-[inset_0_0_10px_rgba(var(--color-sc-blue-rgb),0.05)]" 
                      : "text-sc-grey/60 border-transparent hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-sc-grey/10 bg-black/20">
        <button 
          onClick={logout}
          className="flex items-center space-x-3 text-sc-grey/50 hover:text-red-400 transition-colors w-full px-4 py-2 text-xs font-bold uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
