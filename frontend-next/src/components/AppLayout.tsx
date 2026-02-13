'use client';

import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useRouter, usePathname } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, fetchUser, isLoading } = useAuthStore();
  const { fetchTheme } = useThemeStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchTheme();
    if (isAuthenticated) {
      fetchUser();
    } else if (pathname !== '/login' && pathname !== '/register') {
      router.push('/login');
    }
  }, [isAuthenticated, pathname]);

  if (!isAuthenticated && pathname !== '/login' && pathname !== '/register') {
    return null; // Prevent flicker
  }

  if (pathname === '/login' || pathname === '/register') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-sc-dark text-white flex">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-sc-dark/50">
          {children}
        </div>
      </main>
    </div>
  );
}
