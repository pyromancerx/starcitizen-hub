'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Personnel', href: '/admin/personnel' },
    { name: 'Command Roles', href: '/admin/personnel/roles' },
    { name: 'Data Management', href: '/admin/data' },
    { name: 'System Theme', href: '/admin/theme' },
    { name: 'RSI Verification', href: '/admin/rsi' },
    { name: 'Announcements', href: '/admin/announcements' },
    { name: 'Discord Settings', href: '/admin/discord' },
    { name: 'Audit Log', href: '/admin/audit-log' },
    { name: 'System Settings', href: '/admin/settings' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
          Command Console
        </h2>
      </div>

      {/* Admin Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-sc-grey/10 pb-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all duration-300",
                isActive 
                  ? "border-sc-blue text-sc-blue bg-sc-blue/5" 
                  : "border-transparent text-sc-grey/40 hover:text-white hover:border-sc-grey/20"
              )}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {children}
      </div>
    </div>
  );
}
