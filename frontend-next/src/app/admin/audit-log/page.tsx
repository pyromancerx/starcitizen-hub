'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  ShieldAlert, 
  User as UserIcon, 
  Clock, 
  Terminal,
  Search,
  Filter,
  Eye,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuditLogPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs');
      return res.data;
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-widest uppercase italic border-l-4 border-sc-blue pl-4">
            System Audit Log
          </h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] ml-4 font-mono">
            Cryptographically Signed Activity Record
          </p>
        </div>
        <div className="flex items-center space-x-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sc-grey/40" />
                <input 
                    placeholder="Search logs..."
                    className="bg-sc-dark/50 border border-sc-grey/10 rounded pl-9 pr-4 py-2 text-[10px] text-white focus:outline-none focus:border-sc-blue/50 uppercase tracking-widest font-bold w-64"
                />
            </div>
            <button 
                onClick={() => alert('Log filtering protocols are currently restricted to command-line access.')}
                className="p-2 bg-sc-panel border border-sc-grey/10 rounded text-sc-grey/40 hover:text-white transition-all"
            >
                <Filter className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden shadow-2xl relative">
        <div className="p-4 bg-black/40 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <Activity className="w-4 h-4 text-sc-blue" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Kernel Event Stream</span>
            </div>
            <span className="text-[8px] font-black text-green-500 uppercase tracking-widest animate-pulse">Monitoring Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-sc-dark/50 border-b border-sc-grey/10">
              <tr>
                <th className="px-6 py-4 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Authorized Citizen</th>
                <th className="px-6 py-4 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Action Handler</th>
                <th className="px-6 py-4 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Entity / Target</th>
                <th className="px-6 py-4 text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Security Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sc-grey/20 uppercase tracking-[0.3em] font-black animate-pulse italic">
                    Accessing encrypted ledger...
                  </td>
                </tr>
              ) : logs?.map((log: any) => (
                <tr key={log.id} className="hover:bg-sc-blue/[0.02] transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-[9px] text-sc-grey/40 uppercase">{new Date(log.created_at).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded bg-sc-dark border border-sc-blue/20 flex items-center justify-center text-sc-blue">
                        <UserIcon className="w-3 h-3" />
                      </div>
                      <span className="text-[10px] font-bold text-white uppercase">{log.user?.display_name || 'SYSTEM'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Terminal className="w-3 h-3 text-sc-blue/40" />
                      <span className="text-[10px] text-sc-blue font-black uppercase tracking-tighter">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] text-sc-grey/60 uppercase">{log.target_type || 'N/A'} {log.target_id ? `#${log.target_id}` : ''}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
                        <span className="text-[8px] font-black text-sc-grey/40 uppercase">Verified</span>
                    </div>
                  </td>
                </tr>
              ))}
              {logs?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sc-grey/20 uppercase tracking-[0.3em] font-black italic">
                    No administrative activity recorded in current epoch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Info Card */}
      <div className="p-6 bg-sc-blue/5 border border-sc-blue/20 rounded-lg flex items-start space-x-4">
        <ShieldAlert className="w-6 h-6 text-sc-blue" />
        <div className="space-y-1">
            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Immutable Activity Tracking</h4>
            <p className="text-[9px] text-sc-grey/60 uppercase leading-relaxed font-bold tracking-widest">
                All administrative actions are logged with timestamp, user ID, and IP address. These records are permanent and cannot be modified via the interface.
            </p>
        </div>
      </div>
    </div>
  );
}
