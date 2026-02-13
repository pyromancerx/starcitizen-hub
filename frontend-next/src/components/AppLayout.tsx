'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useRouter, usePathname } from 'next/navigation';
import { Rocket } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();
  const { fetchTheme } = useThemeStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounting, setIsMounting] = useState(true);

  useEffect(() => {
    const start = async () => {
      await Promise.all([
        fetchTheme(),
        initialize()
      ]);
      setIsMounting(false);
    };
    start();
  }, []);

  useEffect(() => {
    if (!isMounting && isInitialized) {
      if (!isAuthenticated && pathname !== '/login' && pathname !== '/register') {
        router.push('/login');
      } else if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
        router.push('/');
      }
    }
  }, [isAuthenticated, isInitialized, pathname, isMounting]);

  // Loading Screen
  if (isMounting || !isInitialized) {
    return (
      <div className="min-h-screen bg-sc-dark flex flex-col items-center justify-center text-sc-blue">
        <div className="relative mb-8">
          <Rocket className="w-16 h-16 animate-bounce" />
          <div className="absolute inset-0 border-4 border-sc-blue rounded-full animate-ping opacity-20"></div>
        </div>
        <div className="text-sm font-black uppercase tracking-[0.5em] animate-pulse">
          Initializing Hub Link...
        </div>
        <div className="mt-4 w-48 bg-sc-blue/10 h-1 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 bg-sc-blue w-1/2 animate-[shimmer_1.5s_infinite]"></div>
        </div>
      </div>
    );
  }

  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (!isAuthenticated && !isAuthPage) {
    return null; // Redirecting...
  }

  if (isAuthPage) {
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