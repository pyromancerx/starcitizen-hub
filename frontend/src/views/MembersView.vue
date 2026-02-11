<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Personnel Manifest</h2>
      <button @click="showInviteMemberModal = true" class="px-4 py-2 bg-sc-blue text-sc-dark text-xs font-bold uppercase tracking-widest hover:bg-white transition-all">Invite Member</button>
    </div>

    <div v-if="memberStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div v-for="member in memberStore.members" :key="member.id" class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6 flex flex-col items-center text-center hover:border-sc-blue/30 transition-all shadow-lg group">
        <div class="relative mb-4">
          <div class="h-20 w-20 rounded-full bg-sc-dark border-2 border-sc-blue/30 flex items-center justify-center text-3xl font-black text-sc-blue group-hover:shadow-[0_0_15px_rgba(102,252,241,0.3)] transition-all">
            {{ member.display_name?.charAt(0) || 'P' }}
          </div>
          <div v-if="member.is_active" class="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-sc-panel shadow-[0_0_5px_#4ade80]"></div>
        </div>
        
        <h3 class="text-lg font-bold text-white uppercase tracking-tight">{{ member.display_name || 'Pilot' }}</h3>
        <div class="text-[10px] text-sc-blue font-bold uppercase tracking-widest mb-4 opacity-70">{{ member.rsi_handle || '@handle_pending' }}</div>
        
        <div class="w-full pt-4 border-t border-sc-grey/5 space-y-2">
          <div class="flex justify-between text-[10px]">
            <span class="text-sc-grey/50 uppercase">Enlisted</span>
            <span class="text-sc-grey">{{ new Date(member.created_at).toLocaleDateString() }}</span>
          </div>
          <div class="flex justify-between text-[10px]">
            <span class="text-sc-grey/50 uppercase">Last Seen</span>
            <span class="text-sc-grey">{{ member.last_seen_at ? new Date(member.last_seen_at).toLocaleDateString() : 'N/A' }}</span>
          </div>
        </div>
        
        <button class="mt-6 w-full py-2 bg-white/5 hover:bg-sc-blue/10 text-[10px] text-sc-grey hover:text-sc-blue font-bold uppercase tracking-widest border border-sc-grey/10 hover:border-sc-blue/30 rounded transition-all">Comm Link</button>
      </div>
      
      <div v-if="memberStore.members.length === 0 && !memberStore.isLoading" class="col-span-full bg-sc-panel border border-sc-grey/10 p-12 text-center rounded-lg">
        <p class="text-sc-grey/30 uppercase tracking-widest">Manifest scanners returned zero results.</p>
      </div>
    </div>
  </div>

  <InviteMemberModal :show="showInviteMemberModal" @close="showInviteMemberModal = false" @invite-member="handleInviteMember" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useMemberStore } from '../stores/members';
import InviteMemberModal from '../components/InviteMemberModal.vue';

const memberStore = useMemberStore();
const showInviteMemberModal = ref(false);

onMounted(() => {
  memberStore.fetchMembers();
});

const handleInviteMember = async (inviteData) => {
  await memberStore.inviteMember(inviteData);
  showInviteMemberModal.value = false;
};
</script>
