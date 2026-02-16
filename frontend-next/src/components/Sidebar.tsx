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
  ChevronRight,
  Globe,
  Building2,
  Radio,
  FileCode,
  Package2,
  Warehouse
} from 'lucide-react';
import { cn, useIsMounted } from '@/lib/utils';
import { X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }: { isOpen?: boolean, onClose?: () => void }) => {
  const isMounted = useIsMounted();
  const pathname = usePathname();
  const { settings } = useThemeStore();
  const { logout } = useAuthStore();

  if (!isMounted) return <aside className="hidden md:flex w-64 bg-sc-panel border-r border-sc-grey/10 flex-shrink-0 flex-col h-screen sticky top-0" />;

  const navGroups = [
    {
      label: 'Assets',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Fleet Registry', href: '/fleet', icon: Rocket },
        { name: 'Planetary Outposts', href: '/bases', icon: Warehouse },
        { name: 'Inventory', href: '/inventory', icon: Package },
        { name: 'Financials', href: '/wallet', icon: Wallet },
        { name: 'Org Stockpiles', href: '/stockpiles', icon: Database },
      ]
    },
    {
      label: 'Social',
      items: [
        { name: 'Operations', href: '/operations', icon: ShieldCheck },
        { name: 'Organization Events', href: '/events', icon: Calendar },
        { name: 'Social Hub', href: '/social', icon: Radio },
        { name: 'Spectrum Forum', href: '/forum', icon: MessageSquare },
        { name: 'Personnel', href: '/members', icon: Users },
        { name: 'Messages', href: '/messages', icon: MessageSquare },
      ]
    },
    {
      label: 'Logistics',
      items: [
        { name: 'Inter-Org Federation', href: '/federation', icon: Globe },
        { name: 'Org Treasury', href: '/treasury', icon: Building2 },
      ]
    },
    {
      label: 'Trading',
      items: [
        { name: 'Trade Runs', href: '/trade', icon: ChevronRight },
        { name: 'Cargo Contracts', href: '/trade/contracts', icon: ChevronRight },
      ]
    },
    {
      label: 'Multi-Crew',
      items: [
        { name: 'Crew Finder', href: '/crew', icon: Users },
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
        { name: 'System Admin', href: '/admin/personnel', icon: Settings },
        { name: 'RSI Verification', href: '/admin/rsi', icon: ShieldCheck },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden animate-in fade-in duration-300" 
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed md:sticky top-0 left-0 z-50 w-64 bg-sc-panel border-r border-sc-grey/10 flex-shrink-0 flex flex-col h-screen transition-transform duration-300 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-sc-grey/10 flex items-center justify-between">
          <div className="flex items-center space-x-3 truncate">
            {settings.logo_url && (
              <img src={settings.logo_url} className="h-8 w-8 object-contain" alt="Org Logo" />
            )}
            <h1 className="text-lg font-bold text-sc-blue tracking-widest uppercase truncate">
              {settings.org_name}
            </h1>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-2 text-sc-grey/40 hover:text-sc-blue transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <h3 className="text-[10px] font-black text-sc-grey/30 uppercase px-4 tracking-widest mb-2">
                {group.label}
              </h3>
              {group.items.map((item) => {
                const isActive = item.href === '/' 
                  ? pathname === '/' || pathname === ''
                  : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
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
    </>
  );
};

export default Sidebar;
