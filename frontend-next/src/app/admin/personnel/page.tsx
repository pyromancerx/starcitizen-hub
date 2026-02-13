'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert,
  UserX,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminPersonnelPage() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, is_active, is_approved }: any) => {
      return api.patch(`/admin/users/${id}`, { is_active, is_approved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const pendingCount = users?.filter((u: any) => !u.is_approved).length || 0;

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-sc-panel border border-sc-grey/10 p-6 rounded relative overflow-hidden">
          <div className="text-[10px] text-sc-grey/40 uppercase font-black tracking-widest mb-1">Total Personnel</div>
          <div className="text-3xl font-bold text-white font-mono">{users?.length || 0}</div>
          <Users className="absolute bottom-[-10px] right-[-10px] w-16 h-16 text-white opacity-5" />
        </div>
        <div className="bg-sc-panel border border-sc-grey/10 p-6 rounded relative overflow-hidden">
          <div className="text-[10px] text-yellow-500/50 uppercase font-black tracking-widest mb-1">Pending Authorization</div>
          <div className="text-3xl font-bold text-yellow-500 font-mono">{pendingCount}</div>
          <ShieldAlert className="absolute bottom-[-10px] right-[-10px] w-16 h-16 text-yellow-500 opacity-10" />
        </div>
      </div>

      <div className="bg-sc-panel border border-sc-grey/10 rounded overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-sc-grey/10">
              <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Citizen</th>
              <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest text-center">Status</th>
              <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest text-center">Roles</th>
              <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sc-grey/5">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-sc-grey/40 uppercase tracking-widest text-[10px] font-mono animate-pulse">
                  Accessing restricted personnel records...
                </td>
              </tr>
            ) : users?.map((user: any) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded bg-sc-dark border border-sc-grey/10 flex items-center justify-center text-sc-blue">
                      {user.avatar_url ? <img src={user.avatar_url} className="rounded" /> : <Users className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white uppercase tracking-tight">{user.display_name}</div>
                      <div className="text-[9px] text-sc-blue font-black uppercase tracking-widest">{user.rsi_handle || 'CITIZEN'}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex flex-col items-center space-y-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                      user.is_approved 
                        ? "bg-green-500/5 border-green-500/20 text-green-400" 
                        : "bg-yellow-500/5 border-yellow-500/20 text-yellow-500 animate-pulse"
                    )}>
                      {user.is_approved ? 'Authorized' : 'Pending'}
                    </span>
                    <span className={cn(
                      "text-[8px] font-bold uppercase",
                      user.is_active ? "text-sc-grey/40" : "text-red-500"
                    )}>
                      {user.is_active ? 'Active Link' : 'Disabled'}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex flex-wrap justify-center gap-1">
                    {user.roles?.map((role: any) => (
                      <span key={role.id} className="px-1.5 py-0.5 bg-sc-dark border border-sc-blue/20 rounded text-[8px] uppercase text-sc-blue">
                        {role.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {!user.is_approved && (
                      <button 
                        onClick={() => updateStatusMutation.mutate({ id: user.id, is_active: true, is_approved: true })}
                        className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded transition-all"
                        title="Approve Member"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => updateStatusMutation.mutate({ id: user.id, is_active: !user.is_active, is_approved: user.is_approved })}
                      className={cn(
                        "p-2 border rounded transition-all",
                        user.is_active 
                          ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30" 
                          : "bg-sc-blue/10 hover:bg-sc-blue/20 text-sc-blue border-sc-blue/30"
                      )}
                      title={user.is_active ? "Disable Account" : "Enable Account"}
                    >
                      {user.is_active ? <UserX className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
