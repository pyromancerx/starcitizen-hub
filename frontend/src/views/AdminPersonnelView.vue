<template>
  <section class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-sc-panel border border-sc-grey/10 p-4 rounded-lg">
        <div class="text-[10px] text-sc-grey/50 uppercase font-black">Total Personnel</div>
        <div class="text-2xl font-bold text-white">{{ memberStore.members.length }}</div>
      </div>
      <div class="bg-sc-panel border border-sc-grey/10 p-4 rounded-lg">
        <div class="text-[10px] text-sc-grey/50 uppercase font-black">Pending Approval</div>
        <div class="text-2xl font-bold text-yellow-500">{{ pendingUsers.length }}</div>
      </div>
    </div>

    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xs text-sc-grey/50 uppercase font-black tracking-widest flex items-center">
        <span class="mr-2 h-px w-8 bg-sc-blue/30"></span> Personnel Authorization
      </h3>
      <button @click="showInviteUserModal = true" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">Invite User</button>
    </div>
    
    <div class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden shadow-2xl">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-black/20 text-[10px] text-sc-grey/50 uppercase tracking-widest font-bold">
            <th class="p-4 border-b border-sc-grey/10">Personnel</th>
            <th class="p-4 border-b border-sc-grey/10">Handle</th>
            <th class="p-4 border-b border-sc-grey/10">Status</th>
            <th class="p-4 border-b border-sc-grey/10 text-right">Clearance</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-for="user in memberStore.members" :key="user.id" class="hover:bg-white/5 border-b border-sc-grey/5 transition-colors">
            <td class="p-4">
              <div class="font-bold text-white uppercase tracking-tight">{{ user.display_name }}</div>
              <div class="text-[10px] text-sc-grey/50">{{ user.email }}</div>
            </td>
            <td class="p-4 text-sc-blue font-mono text-xs">{{ user.rsi_handle }}</td>
            <td class="p-4">
              <span v-if="user.is_approved" class="px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[8px] font-bold uppercase border border-green-500/20">Verified</span>
              <span v-else class="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 text-[8px] font-bold uppercase border border-yellow-500/20">Pending</span>
            </td>
            <td class="p-4 text-right">
              <button v-if="!user.is_approved" @click="handleApprove(user.id)" class="px-3 py-1 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-black uppercase tracking-widest rounded hover:bg-sc-blue hover:text-sc-dark transition-all">Authorize</button>
              <button v-else class="text-sc-grey/30 hover:text-red-400 transition-colors ml-4 text-[10px] font-black uppercase">Revoke</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <InviteUserModal :show="showInviteUserModal" @close="showInviteUserModal = false" @invite-user="handleInviteUser" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useMemberStore } from '../stores/members';
import { useAdminStore } from '../stores/admin';
import InviteUserModal from '../components/InviteUserModal.vue';

const memberStore = useMemberStore();
const adminStore = useAdminStore();

const showInviteUserModal = ref(false);

const pendingUsers = computed(() => memberStore.members.filter(u => !u.is_approved));

const handleApprove = async (userId) => {
  if (confirm('Authorize this pilot for hub access?')) {
    await adminStore.approveUser(userId);
    await memberStore.fetchMembers();
  }
};

const handleInviteUser = async (email) => {
  try {
    await adminStore.inviteUser(email);
    alert('User invited successfully!');
    showInviteUserModal.value = false;
  } catch (error) {
    console.error('Failed to invite user:', error);
    alert('Failed to invite user.');
  }
};

onMounted(() => {
  memberStore.fetchMembers();
});
</script>