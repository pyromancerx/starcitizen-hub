'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/store/themeStore';
import { Rocket, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    display_name: '',
    rsi_handle: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useThemeStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/register', formData);
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Signal blocked.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sc-dark text-white relative">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20"></div>
      <div className="absolute inset-0 bg-black/70"></div>
      
      <div className="relative z-10 w-full max-w-md p-8 bg-sc-panel border border-sc-blue/30 rounded-lg shadow-2xl backdrop-blur-sm">
        <div className="flex flex-col items-center mb-6">
          <ShieldCheck className="h-16 w-16 mb-4 text-sc-blue" />
          <h2 className="text-3xl font-bold text-center text-sc-blue tracking-widest uppercase italic">
            Initialize Signal
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] mt-2">New Citizen Onboarding</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-sc-grey mb-1 uppercase tracking-widest">Email Address</label>
            <input 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              type="email" required 
              className="w-full px-4 py-2 bg-black/50 border border-sc-grey/30 rounded text-xs text-white focus:border-sc-blue transition-all"
              placeholder="pilot@uee.navy"
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-sc-grey mb-1 uppercase tracking-widest">Callsign (Display Name)</label>
            <input 
              value={formData.display_name}
              onChange={(e) => setFormData({...formData, display_name: e.target.value})}
              type="text" required 
              className="w-full px-4 py-2 bg-black/50 border border-sc-grey/30 rounded text-xs text-white focus:border-sc-blue transition-all"
              placeholder="Maverick"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-sc-grey mb-1 uppercase tracking-widest">RSI Handle</label>
            <input 
              value={formData.rsi_handle}
              onChange={(e) => setFormData({...formData, rsi_handle: e.target.value})}
              type="text" required 
              className="w-full px-4 py-2 bg-black/50 border border-sc-grey/30 rounded text-xs text-white focus:border-sc-blue transition-all"
              placeholder="RSI_Citizen_42"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-sc-grey mb-1 uppercase tracking-widest">Security Key (Password)</label>
            <input 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              type="password" required 
              className="w-full px-4 py-2 bg-black/50 border border-sc-grey/30 rounded text-xs text-white focus:border-sc-blue transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-500 text-[10px] text-center bg-red-900/20 p-2 rounded border border-red-500/30 font-bold uppercase tracking-widest">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 bg-sc-blue text-sc-dark text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.3)]"
          >
            {isLoading ? 'Transmitting...' : 'Establish Link'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-xs text-sc-grey uppercase tracking-widest">
          Already verified? <Link href="/login" className="text-sc-blue hover:underline font-bold">Return to Login</Link>
        </p>
      </div>
    </div>
  );
}
