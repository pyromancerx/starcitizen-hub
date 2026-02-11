<template>
  <div class="profile-view max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold text-white mb-6">Citizen Profile</h1>

    <!-- RSI Verification Section -->
    <RSIVerification />

    <!-- Service Record -->
    <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 mt-6 overflow-hidden relative">
      <div class="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <svg class="w-32 h-32 fill-current text-sc-blue" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"></path></svg>
      </div>
      <h2 class="text-xl font-bold text-sc-light-blue mb-6 flex items-center">
        <span class="w-1 h-6 bg-sc-blue mr-3"></span>
        Service Record
      </h2>
      
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="bg-black/20 border border-sc-grey/10 rounded p-4 text-center">
          <div class="text-sc-grey/50 text-[8px] font-black uppercase tracking-widest mb-1">Vessels</div>
          <div class="text-2xl font-black text-white">{{ stats.ships_count }}</div>
        </div>
        <div class="bg-black/20 border border-sc-grey/10 rounded p-4 text-center">
          <div class="text-sc-grey/50 text-[8px] font-black uppercase tracking-widest mb-1">Operations</div>
          <div class="text-2xl font-black text-white">{{ stats.operations_count }}</div>
        </div>
        <div class="bg-black/20 border border-sc-grey/10 rounded p-4 text-center">
          <div class="text-sc-grey/50 text-[8px] font-black uppercase tracking-widest mb-1">Profit (aUEC)</div>
          <div class="text-2xl font-black text-white">{{ formatAUEC(stats.trade_profit) }}</div>
        </div>
        <div class="bg-black/20 border border-sc-grey/10 rounded p-4 text-center">
          <div class="text-sc-grey/50 text-[8px] font-black uppercase tracking-widest mb-1">Contributed</div>
          <div class="text-2xl font-black text-white">{{ formatAUEC(stats.total_contributions) }}</div>
        </div>
        <div class="bg-black/20 border border-sc-grey/10 rounded p-4 text-center">
          <div class="text-sc-grey/50 text-[8px] font-black uppercase tracking-widest mb-1">Awards</div>
          <div class="text-2xl font-black text-white">{{ stats.achievements_count }}</div>
        </div>
      </div>
    </div>

    <!-- Discord Account Link Section -->
    <DiscordAccountLink class="mt-6" />

    <!-- Profile Settings -->
    <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 mt-6">
      <h2 class="text-xl font-bold text-sc-light-blue mb-4">Profile Settings</h2>
      <form @submit.prevent="updateProfile" class="space-y-4">
        <div>
          <label for="displayName" class="block text-sc-grey text-sm font-bold mb-2">Display Name</label>
          <input type="text" id="displayName" v-model="profileForm.display_name"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
        </div>
        <div>
          <label for="avatarUrl" class="block text-sc-grey text-sm font-bold mb-2">Avatar URL (Optional)</label>
          <input type="url" id="avatarUrl" v-model="profileForm.avatar_url"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
        </div>
        
        <div v-if="authStore.error" class="text-red-500 text-sm">
          {{ authStore.error }}
        </div>

        <div class="flex justify-end pt-4">
          <button type="submit" :disabled="authStore.isLoading"
                  class="px-6 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded disabled:opacity-50">
            {{ authStore.isLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import api from '../services/api';
import RSIVerification from '../components/RSIVerification.vue';
import DiscordAccountLink from '../components/DiscordAccountLink.vue';
import { useAuthStore } from '../stores/auth'; // NEW

const authStore = useAuthStore(); // NEW

const profileForm = ref({ // NEW
  display_name: '',
  avatar_url: ''
});

const stats = ref({
  ships_count: 0,
  trade_profit: 0,
  total_contributions: 0,
  operations_count: 0,
  achievements_count: 0
});

const formatAUEC = (val) => {
  if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
  return val.toString();
};

// Watch for authStore.user changes to populate form
watch(() => authStore.user, (newUser) => {
  if (newUser) {
    profileForm.value.display_name = newUser.display_name || '';
    profileForm.value.avatar_url = newUser.avatar_url || '';
    fetchStats(newUser.id);
  }
}, { immediate: true });

const fetchStats = async (userId) => {
  try {
    const res = await api.get(`/stats/user/${userId}`);
    stats.value = res.data;
  } catch (e) {
    console.error('Failed to fetch user stats', e);
  }
};

onMounted(async () => { // Modified to async
  if (!authStore.user) { // Only fetch if not already loaded
    await authStore.fetchUser();
  }
});

const updateProfile = async () => { // NEW
  try {
    await authStore.updateProfile(profileForm.value);
    alert('Profile updated successfully!');
  } catch (err) {
    // Error handled in store, alert is for success feedback
  }
};
</script>
