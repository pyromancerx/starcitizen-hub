'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Shield, 
  Plus, 
  Settings, 
  Check, 
  X, 
  RefreshCw,
  Lock,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PERMISSIONS = [
  { key: 'fleet:read', label: 'View Fleet Registry' },
  { key: 'fleet:write', label: 'Manage Fleet Assets' },
  { key: 'inventory:read', label: 'View Inventory' },
  { key: 'inventory:write', label: 'Manage Inventory' },
  { key: 'wallet:read', label: 'View Financials' },
  { key: 'wallet:write', label: 'Process Transactions' },
  { key: 'forum:read', label: 'Access Spectrum Forum' },
  { key: 'forum:write', label: 'Post in Forum' },
  { key: 'forum:admin', label: 'Moderate Forum' },
  { key: 'ops:read', label: 'View Operations' },
  { key: 'ops:write', label: 'Organize Operations' },
  { key: 'projects:read', label: 'View Projects' },
  { key: 'projects:write', label: 'Manage Projects' },
  { key: 'admin:users', label: 'Manage Personnel' },
  { key: 'admin:system', label: 'Access System Settings' },
  { key: 'admin:rsi', label: 'RSI Verification Control' },
  { key: 'admin:discord', label: 'Manage Discord Relay' },
];

export default function AdminRolesPage() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [newRole, setNewRole] = useState({
    name: '',
    tier: 'custom',
    permissions: '[]',
    is_default: false,
    sort_order: 0
  });

  const { data: roles, isLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const res = await api.get('/admin/roles');
      return res.data;
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      return api.post('/admin/roles', roleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      setShowAddModal(false);
      setNewRole({ name: '', tier: 'custom', permissions: '[]', is_default: false, sort_order: 0 });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      return api.patch(`/admin/roles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      setEditingRole(null);
    },
  });

  const togglePermission = (role: any, perm: string) => {
    let perms = JSON.parse(role.permissions || '[]');
    if (perms.includes(perm)) {
      perms = perms.filter((p: string) => p !== perm);
    } else {
      perms.push(perm);
    }
    
    if (editingRole && editingRole.id === role.id) {
      setEditingRole({ ...editingRole, permissions: JSON.stringify(perms) });
    } else {
      updateRoleMutation.mutate({ id: role.id, data: { permissions: JSON.stringify(perms) } });
    }
  };

  const isPermActive = (role: any, perm: string) => {
    try {
      const perms = JSON.parse(role.permissions || '[]');
      return perms.includes(perm) || perms.includes('*');
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white uppercase italic tracking-widest">Command Authority Hierarchy</h2>
          <p className="text-[10px] text-sc-grey/40 uppercase tracking-[0.2em] font-mono">Permission Mapping & Role Definition</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-2 bg-sc-blue text-sc-dark text-xs font-black uppercase tracking-widest hover:bg-white transition-all flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Define New Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Role List */}
        <div className="lg:col-span-1 space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-sc-grey/20 animate-pulse">Scanning authority records...</div>
          ) : roles?.map((role: any) => (
            <button 
              key={role.id}
              onClick={() => setEditingRole(role)}
              className={cn(
                "w-full p-6 bg-sc-panel border rounded-lg text-left transition-all group relative overflow-hidden",
                editingRole?.id === role.id ? "border-sc-blue shadow-[0_0_20px_rgba(var(--color-sc-blue-rgb),0.1)]" : "border-sc-grey/10 hover:border-sc-grey/30"
              )}
            >
              <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                <Shield className="w-12 h-12" />
              </div>
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">{role.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-[8px] font-black text-sc-blue uppercase tracking-widest px-1.5 py-0.5 bg-sc-blue/5 rounded">Tier: {role.tier}</span>
                    {role.is_default && <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest px-1.5 py-0.5 bg-yellow-500/5 rounded border border-yellow-500/20">Standard</span>}
                  </div>
                </div>
                <ChevronRight className={cn("w-4 h-4 transition-transform", editingRole?.id === role.id ? "text-sc-blue rotate-90" : "text-sc-grey/20")} />
              </div>
            </button>
          ))}
        </div>

        {/* Permissions Editor */}
        <div className="lg:col-span-2">
          {editingRole ? (
            <div className="bg-sc-panel border border-sc-blue/20 rounded-lg p-8 animate-in fade-in slide-in-from-right-4 duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Lock className="w-32 h-32 text-sc-blue" />
              </div>
              
              <div className="flex justify-between items-start mb-8 border-b border-sc-grey/10 pb-6 relative z-10">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">Authority Specification: {editingRole.name}</h3>
                  <p className="text-[10px] text-sc-grey/40 uppercase font-black tracking-widest font-mono">Assigning rights to this command frequency</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => updateRoleMutation.mutate({ id: editingRole.id, data: editingRole })}
                    disabled={updateRoleMutation.isPending}
                    className="px-4 py-2 bg-sc-blue text-sc-dark text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all flex items-center shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.2)]"
                  >
                    {updateRoleMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin mr-2" /> : <Check className="w-3 h-3 mr-2" />}
                    Sync Authority
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {PERMISSIONS.map((perm) => {
                  const active = isPermActive(editingRole, perm.key);
                  return (
                    <button 
                      key={perm.key}
                      onClick={() => togglePermission(editingRole, perm.key)}
                      className={cn(
                        "flex items-center justify-between p-4 border rounded transition-all group",
                        active 
                          ? "bg-sc-blue/5 border-sc-blue/30 text-white shadow-[inset_0_0_10px_rgba(var(--color-sc-blue-rgb),0.05)]" 
                          : "bg-sc-dark/50 border-sc-grey/10 text-sc-grey/40 hover:border-sc-grey/30"
                      )}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">{perm.label}</span>
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                        active ? "bg-sc-blue border-sc-blue" : "border-sc-grey/30 group-hover:border-sc-grey/50"
                      )}>
                        {active && <Check className="w-2.5 h-2.5 text-sc-dark font-black" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full bg-sc-panel border border-sc-grey/10 border-dashed rounded-lg flex flex-col items-center justify-center p-12 text-sc-grey/20">
              <Shield className="w-16 h-16 mb-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Select a role to modify authority</span>
            </div>
          )}
        </div>
      </div>

      {/* Add Role Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-sc-panel border border-sc-blue/30 rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-sc-grey/10 flex justify-between items-center bg-black/20">
              <h3 className="text-sm font-black text-sc-blue uppercase tracking-[0.2em] flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Initialize Authority Definition
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-sc-grey hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                createRoleMutation.mutate(newRole);
              }}
              className="p-6 space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Role Name (Designation)</label>
                <input 
                  type="text" required
                  value={newRole.name}
                  onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                  className="w-full bg-sc-dark border border-sc-grey/20 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all uppercase"
                  placeholder="OFFICER / PILOT / MINER"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-sc-grey/40 uppercase tracking-widest">Tier Specification</label>
                <select 
                  value={newRole.tier}
                  onChange={(e) => setNewRole({...newRole, tier: e.target.value})}
                  className="w-full bg-sc-dark border border-sc-grey/20 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all uppercase"
                >
                  <option value="recruit">Recruit</option>
                  <option value="member">Member</option>
                  <option value="officer">Officer</option>
                  <option value="admin">Admin</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <input 
                  type="checkbox"
                  id="isDefault"
                  checked={newRole.is_default}
                  onChange={(e) => setNewRole({...newRole, is_default: e.target.checked})}
                  className="w-4 h-4 bg-sc-dark border-sc-grey/20 text-sc-blue rounded focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="isDefault" className="text-[10px] font-black text-sc-grey uppercase tracking-widest cursor-pointer">
                  Standard Onboarding Role
                </label>
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={createRoleMutation.isPending}
                  className="w-full py-3 bg-sc-blue text-sc-dark text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_15px_rgba(var(--color-sc-blue-rgb),0.3)] disabled:opacity-50"
                >
                  {createRoleMutation.isPending ? 'Committing Definition...' : 'Finalize Role Protocol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
