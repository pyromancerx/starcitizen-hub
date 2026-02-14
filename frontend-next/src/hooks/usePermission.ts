'use client';

import { useAuthStore } from '@/store/authStore';

export const usePermission = () => {
  const { user } = useAuthStore();

  const hasPermission = (permission: string) => {
    if (!user || !user.roles) return false;

    // Admin override: users with RoleTierAdmin bypass all checks
    const isAdmin = user.roles.some((r: any) => r.tier === 'admin' || r.permissions?.includes('*'));
    if (isAdmin) return true;

    // Check individual role permissions
    return user.roles.some((role: any) => {
      let permissions: string[] = [];
      
      try {
        if (typeof role.permissions === 'string') {
          permissions = JSON.parse(role.permissions);
        } else if (Array.isArray(role.permissions)) {
          permissions = role.permissions;
        }
      } catch (e) {
        console.error("Failed to parse permissions for role:", role.name);
      }

      // Check for exact match or wildcard match
      // e.g., 'missions.create' matches 'missions.*'
      return permissions.some(p => {
        if (p === permission) return true;
        if (p.endsWith('.*')) {
          const prefix = p.split('.*')[0];
          if (permission.startsWith(prefix)) return true;
        }
        return false;
      });
    });
  };

  return { hasPermission };
};
