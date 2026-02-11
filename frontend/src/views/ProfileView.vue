<template>
  <div class="profile-view max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold text-white mb-6">Citizen Profile</h1>

    <!-- RSI Verification Section -->
    <RSIVerification />

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
import RSIVerification from '../components/RSIVerification.vue';
import { useAuthStore } from '../stores/auth'; // NEW

const authStore = useAuthStore(); // NEW

const profileForm = ref({ // NEW
  display_name: '',
  avatar_url: ''
});

// Watch for authStore.user changes to populate form
watch(() => authStore.user, (newUser) => {
  if (newUser) {
    profileForm.value.display_name = newUser.display_name || '';
    profileForm.value.avatar_url = newUser.avatar_url || '';
  }
}, { immediate: true });

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
