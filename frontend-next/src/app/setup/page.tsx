'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Rocket, 
  Shield, 
  Globe, 
  ChevronRight, 
  CheckCircle2, 
  Zap,
  Mail,
  Lock,
  User as UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function SetupWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [setupData, setSetupData] = useState({
    org_name: 'Star Citizen Hub',
    admin_email: '',
    admin_password: '',
    admin_handle: '',
  });

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['setup-status'],
    queryFn: async () => {
      const res = await api.get('/system/setup-status');
      return res.data;
    }
  });

  useEffect(() => {
    if (!statusLoading && status && !status.needs_setup) {
      router.push('/login');
    }
  }, [status, statusLoading, router]);

  const setupMutation = useMutation({
    mutationFn: async () => {
      return api.post('/system/setup', setupData);
    },
    onSuccess: () => {
      setStep(4);
      setTimeout(() => router.push('/login'), 3000);
    }
  });

  if (statusLoading) return null;

  return (
    <div className="min-h-screen bg-sc-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-sc-blue)_0%,_transparent_70%)] opacity-[0.03]"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sc-blue/20 to-transparent"></div>

      <div className="w-full max-w-2xl bg-sc-panel border border-sc-blue/20 rounded-lg shadow-[0_0_50px_rgba(var(--color-sc-blue-rgb),0.1)] relative z-10 overflow-hidden">
        
        {/* Progress Bar */}
        <div className="flex h-1.5 bg-black/40">
            {[1, 2, 3].map((i) => (
                <div key={i} className={cn(
                    "flex-1 transition-all duration-500",
                    step >= i ? "bg-sc-blue shadow-[0_0_10px_rgba(var(--color-sc-blue-rgb),0.5)]" : "bg-transparent"
                )}></div>
            ))}
        </div>

        <div className="p-12">
            {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-2 text-center">
                        <div className="h-16 w-16 bg-sc-blue/10 border border-sc-blue/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Globe className="w-8 h-8 text-sc-blue" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest italic">Institutional Identity</h2>
                        <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] font-bold leading-relaxed">Phase 1: Configure organization parameters</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest">Organization Name</label>
                            <input 
                                value={setupData.org_name}
                                onChange={(e) => setSetupData({...setupData, org_name: e.target.value})}
                                placeholder="Nova Corp, etc."
                                className="w-full bg-sc-dark border border-white/10 rounded px-4 py-3 text-sm text-white focus:border-sc-blue/50 outline-none transition-all font-mono"
                            />
                        </div>
                        <button 
                            onClick={() => setStep(2)}
                            disabled={!setupData.org_name}
                            className="w-full py-4 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all flex items-center justify-center space-x-2"
                        >
                            <span>Initialize Core Module</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="space-y-2 text-center">
                        <div className="h-16 w-16 bg-sc-blue/10 border border-sc-blue/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-8 h-8 text-sc-blue" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest italic">Command Authorization</h2>
                        <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] font-bold leading-relaxed">Phase 2: Establish primary administrator</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Admin Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sc-grey/40" />
                                <input 
                                    type="email"
                                    value={setupData.admin_email}
                                    onChange={(e) => setSetupData({...setupData, admin_email: e.target.value})}
                                    className="w-full bg-sc-dark border border-white/10 rounded pl-10 pr-4 py-3 text-sm text-white focus:border-sc-blue/50 outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Admin RSI Handle</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sc-grey/40" />
                                <input 
                                    value={setupData.admin_handle}
                                    onChange={(e) => setSetupData({...setupData, admin_handle: e.target.value})}
                                    className="w-full bg-sc-dark border border-white/10 rounded pl-10 pr-4 py-3 text-sm text-white focus:border-sc-blue/50 outline-none"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-sc-blue uppercase tracking-widest block">Secure Master Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sc-grey/40" />
                                <input 
                                    type="password"
                                    value={setupData.admin_password}
                                    onChange={(e) => setSetupData({...setupData, admin_password: e.target.value})}
                                    className="w-full bg-sc-dark border border-white/10 rounded pl-10 pr-4 py-3 text-sm text-white focus:border-sc-blue/50 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-4">
                        <button onClick={() => setStep(1)} className="flex-1 py-4 text-[10px] font-black text-sc-grey/40 uppercase hover:text-white transition-all">Re-calibrate Identity</button>
                        <button 
                            onClick={() => setStep(3)}
                            disabled={!setupData.admin_email || !setupData.admin_password || !setupData.admin_handle}
                            className="flex-[2] py-4 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.4)] transition-all flex items-center justify-center space-x-2"
                        >
                            <span>Verify Credentials</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
                    <div className="h-16 w-16 bg-sc-blue/10 border border-sc-blue/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Zap className="w-8 h-8 text-sc-blue animate-pulse" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest italic">Final Synchronization</h2>
                        <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] font-bold leading-relaxed">Phase 3: Deploying institutional tactical core</p>
                    </div>

                    <div className="p-6 bg-black/40 border border-sc-blue/10 rounded text-left space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-sc-grey/40">Organization</span>
                            <span className="text-sc-blue">{setupData.org_name}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-sc-grey/40">Admin Handle</span>
                            <span className="text-white">{setupData.admin_handle}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-sc-grey/40">Security Protocols</span>
                            <span className="text-green-500">AES-256 Active</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => setupMutation.mutate()}
                        disabled={setupMutation.isPending}
                        className="w-full py-4 bg-sc-blue border border-sc-blue text-sc-dark text-[10px] font-black rounded uppercase hover:shadow-[0_0_30px_rgba(var(--color-sc-blue-rgb),0.5)] transition-all flex items-center justify-center space-x-3"
                    >
                        {setupMutation.isPending ? (
                            <>
                                <Zap className="w-4 h-4 animate-spin" />
                                <span>Fabricating Neural Link...</span>
                            </>
                        ) : (
                            <>
                                <Rocket className="w-4 h-4" />
                                <span>Authorize Final Deployment</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 text-center py-12">
                    <div className="h-20 w-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-white uppercase tracking-widest italic">Hub Operational</h2>
                        <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] font-bold leading-relaxed italic">Neural link established. Redirecting to primary command console...</p>
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="mt-8 flex items-center space-x-3 opacity-20 group hover:opacity-100 transition-opacity">
        <Rocket className="w-4 h-4 text-sc-blue" />
        <span className="text-[10px] font-black text-white uppercase tracking-[0.5em]">Star Citizen Hub • Master v1.0.0</span>
      </div>
    </div>
  );
}
