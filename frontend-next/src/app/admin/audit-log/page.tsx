'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  History, 
  Terminal,
  Activity,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuditLogPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const res = await api.get('/admin/audit-log'); // Placeholder - adjust if needed
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden shadow-2xl">
        <div className="bg-black/40 p-4 border-b border-sc-grey/10 flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-sc-blue" />
          <span className="text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">System Event Ledger</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sc-grey/5 bg-sc-dark/20 text-[9px] font-black text-sc-grey/30 uppercase tracking-widest">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Citizen</th>
                <th className="p-4">Action</th>
                <th className="p-4">Target</th>
                <th className="p-4">Coordinates (IP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sc-grey/5 font-mono text-[10px]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-sc-grey/40 animate-pulse">Retrieving encrypted logs...</td>
                </tr>
              ) : logs?.length > 0 ? (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-sc-grey/50">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-4 text-sc-blue font-bold">{log.user?.display_name || 'SYSTEM'}</td>
                    <td className="p-4 uppercase text-white">{log.action}</td>
                    <td className="p-4 italic text-sc-grey/60">{log.target_type} ({log.target_id})</td>
                    <td className="p-4 text-sc-grey/30">{log.ip_address}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-sc-grey/20 uppercase tracking-widest italic">No events recorded. System clean.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
