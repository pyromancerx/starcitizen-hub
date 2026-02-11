<template>
  <section class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-sc-panel border border-sc-grey/10 p-4 rounded-lg">
        <div class="text-[10px] text-sc-grey/50 uppercase font-black">Total Personnel</div>
        <div class="text-2xl font-bold text-white">{{ adminStore.users.length }}</div>
      </div>
      <div class="bg-sc-panel border border-sc-grey/10 p-4 rounded-lg">
        <div class="text-[10px] text-sc-grey/50 uppercase font-black">Pending Approval</div>
        <div class="text-2xl font-bold text-yellow-500">{{ pendingUsers.length }}</div>
      </div>
      <div class="bg-sc-panel border border-sc-grey/10 p-4 rounded-lg">
        <div class="text-[10px] text-sc-grey/50 uppercase font-black">Active Personnel</div>
        <div class="text-2xl font-bold text-green-500">{{ activeUsers.length }}</div>
      </div>
      <div class="bg-sc-panel border border-sc-grey/10 p-4 rounded-lg">
        <div class="text-[10px] text-sc-grey/50 uppercase font-black">Inactive Personnel</div>
        <div class="text-2xl font-bold text-red-500">{{ inactiveUsers.length }}</div>
      </div>
    </div>

    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xs text-sc-grey/50 uppercase font-black tracking-widest flex items-center">
        <span class="mr-2 h-px w-8 bg-sc-blue/30"></span> Personnel Authorization
      </h3>
      <button @click="showInviteUserModal = true" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">Invite User</button>
    </div>
    
    <div v-if="adminStore.isLoading && adminStore.users.length === 0" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden shadow-2xl">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-black/20 text-[10px] text-sc-grey/50 uppercase tracking-widest font-bold">
            <th class="p-4 border-b border-sc-grey/10">Personnel</th>
            <th class="p-4 border-b border-sc-grey/10">Handle</th>
            <th class="p-4 border-b border-sc-grey/10">Status</th>
            <th class="p-4 border-b border-sc-grey/10 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-if="adminStore.users.length === 0">
            <td colspan="4" class="p-4 text-center text-sc-grey/50">No personnel found.</td>
          </tr>
          <tr v-for="user in adminStore.users" :key="user.id" class="hover:bg-white/5 border-b border-sc-grey/5 transition-colors">
            <td class="p-4">
              <div class="font-bold text-white uppercase tracking-tight">{{ user.display_name }}</div>
              <div class="text-[10px] text-sc-grey/50">{{ user.email }}</div>
            </td>
            <td class="p-4 text-sc-blue font-mono text-xs">{{ user.rsi_handle }}</td>
            <td class="p-4">
              <span v-if="user.is_approved" class="px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[8px] font-bold uppercase border border-green-500/20">Approved</span>
              <span v-else class="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 text-[8px] font-bold uppercase border border-yellow-500/20">Pending</span>
              <span v-if="!user.is_active" class="ml-2 px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-[8px] font-bold uppercase border border-red-500/20">Inactive</span>
            </td>
            <td class="p-4 text-right">
              <button v-if="!user.is_approved" @click="handleApprove(user.id)" class="px-3 py-1 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-black uppercase tracking-widest rounded hover:bg-sc-blue hover:text-sc-dark transition-all mr-2">Approve</button>
              <button v-if="user.is_active" @click="handleDeactivate(user.id)" class="px-3 py-1 bg-red-500/10 border border-red-500 text-red-500 text-[10px] font-black uppercase tracking-widest rounded hover:bg-red-500 hover:text-sc-dark transition-all mr-2">Deactivate</button>
              <button v-else @click="handleActivate(user.id)" class="px-3 py-1 bg-green-500/10 border border-green-500 text-green-500 text-[10px] font-black uppercase tracking-widest rounded hover:bg-green-500 hover:text-sc-dark transition-all mr-2">Activate</button>
              <button @click="openChangePasswordModal(user.id)" class="px-3 py-1 bg-purple-500/10 border border-purple-500 text-purple-500 text-[10px] font-black uppercase tracking-widest rounded hover:bg-purple-500 hover:text-sc-dark transition-all mr-2">Change Password</button>
              <button @click="handleDeleteUser(user.id)" class="px-3 py-1 bg-orange-500/10 border border-orange-500 text-orange-500 text-[10px] font-black uppercase tracking-widest rounded hover:bg-orange-500 hover:text-sc-dark transition-all">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <InviteUserModal :show="showInviteUserModal" @close="showInviteUserModal = false" @invite-user="handleInviteUser" />
  <ChangeUserPasswordModal :show="showChangePasswordModal" @close="showChangePasswordModal = false" :user-id="userToChangePassword" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAdminStore } from '../stores/admin';
import InviteUserModal from '../components/InviteUserModal.vue';
import ChangeUserPasswordModal from '../components/ChangeUserPasswordModal.vue'; // New modal

const adminStore = useAdminStore();

const showInviteUserModal = ref(false);
const showChangePasswordModal = ref(false);
const userToChangePassword = ref(null);

const pendingUsers = computed(() => adminStore.users.filter(u => !u.is_approved));
const activeUsers = computed(() => adminStore.users.filter(u => u.is_active));
const inactiveUsers = computed(() => adminStore.users.filter(u => !u.is_active));

const handleApprove = async (userId) => {
  if (confirm('Authorize this pilot for hub access?')) {
    try {
      await adminStore.adminApproveUser(userId);
      alert('User approved successfully!');
    } catch (error) {
      alert(error.message || 'Failed to approve user.');
    }
  }
};

const handleDeactivate = async (userId) => {
  if (confirm('Are you sure you want to deactivate this user? They will not be able to log in.')) {
    try {
      await adminStore.adminSetUserStatus(userId, false);
      alert('User deactivated successfully!');
    } catch (error) {
      alert(error.message || 'Failed to deactivate user.');
    }
  }
};

const handleActivate = async (userId) => {
  if (confirm('Are you sure you want to activate this user? They will be able to log in.')) {
    try {
      await adminStore.adminSetUserStatus(userId, true);
      alert('User activated successfully!');
    } catch (error) {
      alert(error.message || 'Failed to activate user.');
    }
  }
};

const openChangePasswordModal = (userId) => {
  userToChangePassword.value = userId;
  showChangePasswordModal.value = true;
};

const handleDeleteUser = async (userId) => {
  if (confirm('Are you sure you want to permanently delete this user? This cannot be undone.')) {
    try {
      await adminStore.adminDeleteUser(userId);
      alert('User deleted successfully!');
    } catch (error) {
      alert(error.message || 'Failed to delete user.');
    }
  }
};

const handleInviteUser = async (email) => {
  try {
    await adminStore.inviteUser(email); // Assuming adminStore will have inviteUser eventually
    alert('User invited successfully!');
    showInviteUserModal.value = false;
  } catch (error) {
    console.error('Failed to invite user:', error);
    alert('Failed to invite user.');
  }
};

onMounted(() => {
  adminStore.fetchAllUsers();
});
</script>