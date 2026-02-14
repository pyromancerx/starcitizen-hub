'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useRouter, usePathname } from 'next/navigation';
import { Rocket } from 'lucide-react';
import LoginPage from '@/app/login/page';
import { CallProvider } from '@/context/CallContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();
  const { fetchTheme } = useThemeStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounting, setIsMounting] = useState(true);

  const { data: setupStatus } = useQuery({
    queryKey: ['system-setup-status'],
    queryFn: async () => {
      const res = await api.get('/system/setup-status');
      return res.data;
    },
    enabled: isInitialized
  });

  useEffect(() => {
    if (!isMounting && isInitialized && setupStatus?.needs_setup && pathname !== '/setup') {
        router.push('/setup');
    }
  }, [isMounting, isInitialized, setupStatus, pathname, router]);

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

  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  useEffect(() => {
    if (!isMounting && isInitialized) {
      if (isAuthenticated && isAuthPage) {
        router.push('/');
      }
    }
  }, [isAuthenticated, isInitialized, pathname, isMounting, isAuthPage]);

  // 1. Initial Loading State
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

  // 2. Not Authenticated logic
  if (!isAuthenticated) {
    // If they are on register, show register
    if (pathname?.startsWith('/register')) {
      return <>{children}</>;
    }
    // For ALL other pages, if not authenticated, show Login page directly
    return <LoginPage />;
  }

  // 3. Authenticated logic
  // If authenticated but on an auth page, we are redirecting (handled in useEffect), 
  // but show nothing or loading to prevent flicker
  if (isAuthPage) {
    return null;
  }

    // Standard Layout for Authenticated Users

    return (

      <CallProvider>

        <div className="min-h-screen bg-sc-dark text-white flex">

          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

            <Header />

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-sc-dark/50">

              {children}

            </div>

          </main>

        </div>

      </CallProvider>

    );

  }

  