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
  X,
  Plus,
  RefreshCw,
  Trash2,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminPersonnelPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'rsi'>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  const { data: roles } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const res = await api.get('/admin/roles');
      return res.data;
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userID, roleID }: any) => {
      return api.post(`/admin/users/${userID}/roles`, { role_id: roleID });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userID, roleID }: any) => {
      return api.delete(`/admin/users/${userID}/roles/${roleID}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
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

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('Personnel record purged from system.');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      return api.patch(`/admin/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingUser(null);
    },
  });

  const { data: rsiMembers } = useQuery({
    queryKey: ['rsi-members'],
    queryFn: async () => {
      const res = await api.get('/admin/rsi-members');
      return res.data;
    },
    enabled: filter === 'rsi',
  });

  const pendingCount = users?.filter((u: any) => !u.is_approved).length || 0;
  
  const filteredUsers = React.useMemo(() => {
    let list = filter === 'all' ? (users || []) : filter === 'pending' ? users?.filter((u: any) => !u.is_approved) || [] : [];
    
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        list = list.filter((u: any) => 
            u.display_name?.toLowerCase().includes(query) || 
            u.rsi_handle?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query)
        );
    }
    return list;
  }, [users, filter, searchQuery]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 max-w-3xl">
          <button 
            onClick={() => setFilter('all')}
            className={cn(
                "bg-sc-panel border p-6 rounded relative overflow-hidden text-left transition-all",
                filter === 'all' ? "border-sc-blue/50 shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.1)]" : "border-sc-grey/10"
            )}
          >
            <div className="text-[10px] text-sc-grey/40 uppercase font-black tracking-widest mb-1">Total Personnel</div>
            <div className="text-3xl font-bold text-white font-mono">{users?.length || 0}</div>
            <Users className="absolute bottom-[-10px] right-[-10px] w-16 h-16 text-white opacity-5" />
          </button>
          
          <button 
            onClick={() => setFilter('pending')}
            className={cn(
                "bg-sc-panel border p-6 rounded relative overflow-hidden text-left transition-all",
                filter === 'pending' ? "border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]" : "border-sc-grey/10"
            )}
          >
            <div className="text-[10px] text-yellow-500/50 uppercase font-black tracking-widest mb-1">Pending Authorization</div>
            <div className="text-3xl font-bold text-yellow-500 font-mono">{pendingCount}</div>
            <ShieldAlert className="absolute bottom-[-10px] right-[-10px] w-16 h-16 text-yellow-500 opacity-10" />
          </button>

          <button 
            onClick={() => setFilter('rsi')}
            className={cn(
                "bg-sc-panel border p-6 rounded relative overflow-hidden text-left transition-all",
                filter === 'rsi' ? "border-sc-blue/50 shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.1)]" : "border-sc-grey/10"
            )}
          >
            <div className="text-[10px] text-sc-grey/40 uppercase font-black tracking-widest mb-1">RSI Sync Registry</div>
            <div className="text-3xl font-bold text-white font-mono">{rsiMembers?.length || 0}</div>
            <RefreshCw className="absolute bottom-[-10px] right-[-10px] w-16 h-16 text-white opacity-5" />
          </button>
        </div>
        <div className="flex items-center space-x-3">
            <div className="relative">
                <Settings className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sc-grey/40" />
                <input 
                    placeholder="Search personnel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-sc-dark/50 border border-sc-grey/10 rounded pl-9 pr-4 py-2 text-[10px] text-white focus:outline-none focus:border-sc-blue/50 uppercase tracking-widest font-bold w-64"
                />
            </div>
            <button 
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2.5 bg-sc-blue text-sc-dark text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.3)] flex items-center whitespace-nowrap"
            >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Citizen
            </button>
        </div>
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
        {filter === 'rsi' ? (
            <RSIMemberTable members={rsiMembers} onAdd={(m: any) => {
                setNewUser({ ...newUser, rsi_handle: m.rsi_handle, display_name: m.rsi_handle });
                setShowAddModal(true);
            }} />
        ) : (
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
            ) : filteredUsers?.map((user: any) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded bg-sc-dark border border-sc-grey/10 flex items-center justify-center text-sc-blue">
                      {user.avatar_url ? <img src={user.avatar_url} className="rounded" alt="Avatar" /> : <Users className="w-5 h-5" />}
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
                <td className="p-4">
                  <div className="flex flex-wrap gap-1 items-center justify-center">
                    {user.roles?.map((role: any) => (
                      <span key={role.id} className="group/role px-1.5 py-0.5 bg-sc-dark border border-sc-blue/20 rounded text-[8px] uppercase text-sc-blue flex items-center">
                        {role.name}
                        <button 
                          onClick={() => removeRoleMutation.mutate({ userID: user.id, roleID: role.id })}
                          className="ml-1 text-sc-grey/30 hover:text-red-400 opacity-0 group-hover/role:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    <div className="relative group/add">
                      <button className="p-1 rounded bg-sc-blue/5 border border-sc-blue/10 text-sc-blue hover:bg-sc-blue/20 transition-all">
                        <Plus className="w-3 h-3" />
                      </button>
                      <div className="absolute left-0 top-full mt-1 bg-sc-panel border border-sc-blue/20 rounded shadow-2xl z-10 hidden group-hover/add:block min-w-[120px]">
                        {roles?.filter((r: any) => !user.roles?.find((ur: any) => ur.id === r.id)).map((role: any) => (
                          <button 
                            key={role.id}
                            onClick={() => assignRoleMutation.mutate({ userID: user.id, roleID: role.id })}
                            className="w-full text-left px-3 py-2 text-[8px] font-black uppercase text-sc-grey hover:text-sc-blue hover:bg-sc-blue/5 transition-all"
                          >
                            {role.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                        onClick={() => setEditingUser(user)}
                        className="p-2 hover:bg-white/5 text-sc-grey hover:text-white rounded transition-all"
                        title="Edit User"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
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
                    <button 
                      onClick={() => {
                        if(confirm('Are you sure you want to permanently delete this user?')) {
                            deleteUserMutation.mutate(user.id);
                        }
                      }}
                      className="p-2 hover:bg-red-500/10 text-sc-grey hover:text-red-500 rounded transition-all"
                      title="Delete User"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal 
            user={editingUser} 
            onClose={() => setEditingUser(null)} 
            onSave={(data: any) => updateUserMutation.mutate({ id: editingUser.id, data })}
            isPending={updateUserMutation.isPending}
        />
      )}
    </section>
  );
}

const RSIMemberTable = ({ members, onAdd }: { members: any[], onAdd: (m: any) => void }) => (
    <table className="w-full text-left border-collapse">
        <thead>
            <tr className="bg-black/40 border-b border-sc-grey/10">
                <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">RSI Handle</th>
                <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest">Last Synced</th>
                <th className="p-4 text-[10px] font-black text-sc-grey/50 uppercase tracking-widest text-right">Action</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-sc-grey/5">
            {members?.map((member: any) => (
                <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                        <div className="text-sm font-bold text-white uppercase tracking-tight font-mono">{member.rsi_handle}</div>
                    </td>
                    <td className="p-4">
                        <div className="text-[10px] text-sc-grey/40 uppercase font-bold">{new Date(member.last_synced_at).toLocaleString()}</div>
                    </td>
                    <td className="p-4 text-right">
                        <button 
                            onClick={() => onAdd(member)}
                            className="px-3 py-1 bg-sc-blue/10 border border-sc-blue/30 text-sc-blue text-[8px] font-black rounded uppercase hover:bg-sc-blue hover:text-sc-dark transition-all"
                        >
                            Setup Account
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);

const EditUserModal = ({ user, onClose, onSave, isPending }: any) => {
    const [form, setForm] = useState({
        display_name: user.display_name,
        rsi_handle: user.rsi_handle,
        email: user.email,
        is_active: user.is_active,
        is_approved: user.is_approved,
        password: ''
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-sc-panel border border-sc-blue/30 rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-sc-grey/10 flex justify-between items-center bg-black/20">
                    <h3 className="text-sm font-black text-sc-blue uppercase tracking-[0.2em]">Edit Personnel Record</h3>
                    <button onClick={onClose} className="text-sc-grey hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Callsign</label>
                        <input value={form.display_name} onChange={e => setForm({...form, display_name: e.target.value})} className="w-full bg-sc-dark border border-sc-grey/20 rounded px-3 py-2 text-xs text-white" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">RSI Handle</label>
                        <input value={form.rsi_handle} onChange={e => setForm({...form, rsi_handle: e.target.value})} className="w-full bg-sc-dark border border-sc-grey/20 rounded px-3 py-2 text-xs text-white" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Email</label>
                        <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-sc-dark border border-sc-grey/20 rounded px-3 py-2 text-xs text-white" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Security Key (Password - Leave blank to keep current)</label>
                        <input 
                            type="password"
                            value={form.password} 
                            onChange={e => setForm({...form, password: e.target.value})} 
                            className="w-full bg-sc-dark border border-sc-grey/20 rounded px-3 py-2 text-xs text-white focus:border-sc-blue/50 outline-none" 
                            placeholder="New secure signal..."
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button onClick={onClose} className="px-4 py-2 text-xs font-black text-sc-grey/40 uppercase">Cancel</button>
                        <button 
                            onClick={() => {
                                const payload = { ...form };
                                if (!payload.password) delete (payload as any).password;
                                onSave(payload);
                            }} 
                            disabled={isPending}
                            className="px-6 py-2 bg-sc-blue text-sc-dark text-xs font-black rounded uppercase hover:bg-white transition-all disabled:opacity-50"
                        >
                            {isPending ? 'Updating...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
