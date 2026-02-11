<template>
  <div class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xl font-bold text-white">Discord Account</h3>
    </div>

    <div v-if="isLoading" class="flex justify-center p-4">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else>
      <div v-if="discordLink" class="flex items-center space-x-4">
        <img :src="discordAvatarUrl" alt="Discord Avatar" class="w-12 h-12 rounded-full border border-sc-blue/50" />
        <div>
          <p class="text-white text-lg font-bold">{{ discordLink.discord_username }}<span v-if="discordLink.discord_discriminator !== '0'">#{{ discordLink.discord_discriminator }}</span></p>
          <p class="text-sc-grey/70 text-sm">Account Linked</p>
        </div>
        <button @click="handleUnlinkAccount" class="ml-auto px-4 py-2 bg-red-500/10 border border-red-500 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-sc-dark transition-all">Unlink</button>
      </div>
      <div v-else class="text-center">
        <p class="text-sc-grey/70 mb-4">Link your Discord account to enable integration features.</p>
        <a :href="discordLoginUrl" @click.prevent="handleLinkAccount" class="px-6 py-2 bg-sc-blue text-sc-dark font-bold uppercase tracking-widest text-xs rounded hover:bg-white transition-all shadow-[0_0_15px_rgba(102,252,241,0.2)]">Link Discord Account</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import DiscordService from '../services/DiscordService';

const discordLink = ref(null);
const isLoading = ref(true);
const discordLoginUrl = ref('');

const fetchDiscordLinkStatus = async () => {
  try {
    discordLink.value = await DiscordService.getMyDiscordLink();
  } catch (error) {
    console.error('Failed to fetch Discord link status:', error);
    // Handle error, e.g., display message or keep discordLink null
  }
};

const fetchDiscordLoginUrl = async () => {
  try {
    const response = await DiscordService.getDiscordLoginUrl();
    discordLoginUrl.value = response.url;
  } catch (error) {
    console.error('Failed to fetch Discord login URL:', error);
    // Handle error
  }
};

const handleLinkAccount = () => {
  if (discordLoginUrl.value) {
    window.location.href = discordLoginUrl.value;
  } else {
    alert('Discord OAuth is not configured or URL could not be fetched.');
  }
};

const handleUnlinkAccount = async () => {
  if (confirm('Are you sure you want to unlink your Discord account?')) {
    try {
      await DiscordService.unlinkDiscord();
      alert('Discord account unlinked successfully!');
      discordLink.value = null; // Update UI
      fetchDiscordLoginUrl(); // Refresh login URL in case state changed
    } catch (error) {
      console.error('Failed to unlink Discord account:', error);
      alert('Failed to unlink Discord account.');
    }
  }
};

const discordAvatarUrl = computed(() => {
  if (discordLink.value && discordLink.value.discord_id && discordLink.value.discord_avatar) {
    const avatar = discordLink.value.discord_avatar;
    const discordId = discordLink.value.discord_id;
    if (avatar.startsWith('a_')) { // Animated GIF
      return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.gif`;
    } else {
      return `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png`;
    }
  }
  return `https://cdn.discordapp.com/embed/avatars/${parseInt(discordLink.value?.discord_discriminator || '0') % 5}.png`;
});

onMounted(async () => {
  isLoading.value = true;
  await Promise.all([
    fetchDiscordLinkStatus(),
    fetchDiscordLoginUrl(),
  ]);
  isLoading.value = false;
});
</script>

<style scoped>
/* Specific styles for DiscordAccountLink */
</style>
