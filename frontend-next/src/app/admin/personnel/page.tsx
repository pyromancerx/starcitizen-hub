'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert,
  UserX,
  CheckCircle2,
  Clock,
  UserPlus,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminPersonnelPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    display_name: '',
    rsi_handle: '',
    is_admin: false
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data;
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return api.post('/admin/users', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowAddModal(false);
      setNewUser({
        email: '',
        password: '',
        display_name: '',
        rsi_handle: '',
        is_admin: false
      });
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
      <div className="flex justify-between items-end">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 max-w-2xl">
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
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-sc-blue text-sc-dark text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.3)] flex items-center"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Citizen
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-sc-panel border border-sc-blue/30 rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-sc-grey/10 flex justify-between items-center bg-black/20">
              <h3 className="text-sm font-black text-sc-blue uppercase tracking-[0.2em] flex items-center">
                <UserPlus className="w-4 h-4 mr-2" />
                Initialize New Record
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-sc-grey hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                createUserMutation.mutate(newUser);
              }}
              className="p-6 space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email" required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full bg-sc-dark border border-sc-grey/20 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all"
                  placeholder="citizen@uee.navy"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Security Key (Password)</label>
                <input 
                  type="password" required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full bg-sc-dark border border-sc-grey/20 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Callsign</label>
                  <input 
                    type="text" required
                    value={newUser.display_name}
                    onChange={(e) => setNewUser({...newUser, display_name: e.target.value})}
                    className="w-full bg-sc-dark border border-sc-grey/20 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all"
                    placeholder="Maverick"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">RSI Handle</label>
                  <input 
                    type="text" required
                    value={newUser.rsi_handle}
                    onChange={(e) => setNewUser({...newUser, rsi_handle: e.target.value})}
                    className="w-full bg-sc-dark border border-sc-grey/20 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all"
                    placeholder="ADMIN_CORE"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <input 
                  type="checkbox"
                  id="isAdmin"
                  checked={newUser.is_admin}
                  onChange={(e) => setNewUser({...newUser, is_admin: e.target.checked})}
                  className="w-4 h-4 bg-sc-dark border-sc-grey/20 text-sc-blue rounded focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="isAdmin" className="text-[10px] font-black text-sc-grey uppercase tracking-widest cursor-pointer">
                  Grant Command Authority (Admin)
                </label>
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="w-full py-3 bg-sc-blue text-sc-dark text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.3)] disabled:opacity-50"
                >
                  {createUserMutation.isPending ? 'Writing Record...' : 'Finalize Record Creation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
