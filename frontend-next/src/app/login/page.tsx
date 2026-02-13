'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Rocket } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, isAuthenticated } = useAuthStore();
  const { settings } = useThemeStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      console.error('Login failed', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sc-dark text-white relative">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20"></div>
      <div className="absolute inset-0 bg-black/70"></div>
      
      <div className="relative z-10 w-full max-w-md p-8 bg-sc-panel border border-sc-blue/30 rounded-lg shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col items-center mb-6">
          {settings.logo_url ? (
            <img src={settings.logo_url} className="h-16 w-16 mb-4 object-contain" alt="Logo" />
          ) : (
            <Rocket className="h-16 w-16 mb-4 text-sc-blue" />
          )}
          <h2 className="text-3xl font-bold text-center text-sc-blue tracking-widest uppercase italic">
            {settings.org_name}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-sc-grey mb-2 uppercase tracking-widest">
              Email Address
            </label>
            <input 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email" 
              required 
              className="w-full px-4 py-2 bg-black/50 border border-sc-grey/30 rounded focus:ring-2 focus:ring-sc-blue focus:border-transparent outline-none text-white transition-all placeholder-sc-grey/20"
              placeholder="pilot@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-sc-grey mb-2 uppercase tracking-widest">
              Password
            </label>
            <input 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password" 
              required 
              className="w-full px-4 py-2 bg-black/50 border border-sc-grey/30 rounded focus:ring-2 focus:ring-sc-blue focus:border-transparent outline-none text-white transition-all placeholder-sc-grey/20"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded border border-red-500/30 font-bold">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 px-4 bg-sc-blue/10 hover:bg-sc-blue/20 border border-sc-blue text-sc-blue font-bold rounded uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Initializing...' : 'Access Link Established'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-sc-grey uppercase tracking-widest">
          No account? <Link href="/register" className="text-sc-light-blue hover:text-sc-blue hover:underline font-bold">Request Signal Access</Link>
        </p>
      </div>
    </div>
  );
}
