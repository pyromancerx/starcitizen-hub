<template>
  <div class="privacy-settings space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Privacy & Data</h2>
    </div>

    <!-- Deletion Warning Banner -->
    <div v-if="hasDeletionRequest" class="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
      <div class="flex items-start gap-3">
        <svg class="w-6 h-6 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <div class="flex-1">
          <h3 class="text-red-400 font-bold uppercase tracking-widest">Account Deletion Scheduled</h3>
          <p class="text-white/70 text-sm mt-1">
            Your account is scheduled for deletion in <strong class="text-white">{{ daysUntilDeletion }} days</strong>.
            All your data will be permanently removed.
          </p>
          <button 
            @click="showCancelModal = true"
            class="mt-3 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-sm font-bold uppercase tracking-widest transition-colors"
          >
            Cancel Deletion
          </button>
        </div>
      </div>
    </div>

    <!-- Privacy Settings -->
    <div class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6">
      <h3 class="text-lg font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
        <svg class="w-5 h-5 text-sc-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
        Privacy Settings
      </h3>

      <div v-if="isLoading" class="py-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sc-blue mx-auto"></div>
      </div>

      <div v-else class="space-y-6">
        <!-- Leaderboards -->
        <div class="flex items-center justify-between p-4 bg-sc-dark/50 rounded-lg">
          <div>
            <div class="text-white font-medium">Hide from Leaderboards</div>
            <p class="text-sm text-sc-grey/70">Your name won't appear in public leaderboards</p>
          </div>
          <button 
            @click="toggleSetting('hide_from_leaderboards')"
            :class="[
              'w-14 h-7 rounded-full transition-colors relative',
              settings.hide_from_leaderboards ? 'bg-sc-blue' : 'bg-sc-grey/30'
            ]"
          >
            <span 
              :class="[
                'absolute top-1 w-5 h-5 rounded-full bg-white transition-all',
                settings.hide_from_leaderboards ? 'right-1' : 'left-1'
              ]"
            />
          </button>
        </div>

        <!-- Trade Activity -->
        <div class="flex items-center justify-between p-4 bg-sc-dark/50 rounded-lg">
          <div>
            <div class="text-white font-medium">Hide Trade Activity</div>
            <p class="text-sm text-sc-grey/70">Your trade runs won't be visible in activity feed</p>
          </div>
          <button 
            @click="toggleSetting('hide_trade_activity')"
            :class="[
              'w-14 h-7 rounded-full transition-colors relative',
              settings.hide_trade_activity ? 'bg-sc-blue' : 'bg-sc-grey/30'
            ]"
          >
            <span 
              :class="[
                'absolute top-1 w-5 h-5 rounded-full bg-white transition-all',
                settings.hide_trade_activity ? 'right-1' : 'left-1'
              ]"
            />
          </button>
        </div>

        <!-- Achievements -->
        <div class="flex items-center justify-between p-4 bg-sc-dark/50 rounded-lg">
          <div>
            <div class="text-white font-medium">Hide Achievements</div>
            <p class="text-sm text-sc-grey/70">Your achievements won't be shown on your profile</p>
          </div>
          <button 
            @click="toggleSetting('hide_achievements')"
            :class="[
              'w-14 h-7 rounded-full transition-colors relative',
              settings.hide_achievements ? 'bg-sc-blue' : 'bg-sc-grey/30'
            ]"
          >
            <span 
              :class="[
                'absolute top-1 w-5 h-5 rounded-full bg-white transition-all',
                settings.hide_achievements ? 'right-1' : 'left-1'
              ]"
            />
          </button>
        </div>

        <!-- Data Export -->
        <div class="flex items-center justify-between p-4 bg-sc-dark/50 rounded-lg">
          <div>
            <div class="text-white font-medium">Allow Data Export</div>
            <p class="text-sm text-sc-grey/70">Enable downloading your personal data</p>
          </div>
          <button 
            @click="toggleSetting('allow_data_export')"
            :class="[
              'w-14 h-7 rounded-full transition-colors relative',
              settings.allow_data_export ? 'bg-sc-blue' : 'bg-sc-grey/30'
            ]"
          >
            <span 
              :class="[
                'absolute top-1 w-5 h-5 rounded-full bg-white transition-all',
                settings.allow_data_export ? 'right-1' : 'left-1'
              ]"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Data Export Section -->
    <div class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6">
      <h3 class="text-lg font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
        <svg class="w-5 h-5 text-sc-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Export Your Data
      </h3>

      <p class="text-sc-grey/70 mb-6">
        Download a copy of all your personal data stored in our system. This includes your profile, ships, transactions, messages, and more.
      </p>

      <div class="flex gap-4">
        <button 
          @click="exportData('json')"
          :disabled="!settings.allow_data_export || isLoading"
          class="flex-1 px-4 py-3 bg-sc-blue/20 border border-sc-blue/50 text-sc-blue hover:bg-sc-blue/30 disabled:opacity-50 disabled:cursor-not-allowed rounded font-bold uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
          </svg>
          Export as JSON
        </button>
        <button 
          @click="exportData('csv')"
          :disabled="!settings.allow_data_export || isLoading"
          class="flex-1 px-4 py-3 bg-sc-blue/20 border border-sc-blue/50 text-sc-blue hover:bg-sc-blue/30 disabled:opacity-50 disabled:cursor-not-allowed rounded font-bold uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Export as CSV
        </button>
      </div>

      <p v-if="!settings.allow_data_export" class="text-yellow-400 text-sm mt-3 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        Data export is currently disabled. Enable it above to download your data.
      </p>

      <p v-if="settings.last_exported_at" class="text-sc-grey/50 text-xs mt-3">
        Last exported: {{ formatDate(settings.last_exported_at) }}
      </p>
    </div>

    <!-- Danger Zone - Account Deletion -->
    <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
      <h3 class="text-lg font-bold text-red-400 uppercase tracking-widest mb-6 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        Danger Zone
      </h3>

      <p class="text-sc-grey/70 mb-6">
        Once you delete your account, there is no going back. This action cannot be undone and all your data will be permanently removed.
      </p>

      <button 
        @click="showDeleteModal = true"
        class="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded font-bold uppercase tracking-widest text-sm transition-colors"
      >
        Delete Account
      </button>
    </div>

    <!-- Delete Account Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div class="bg-sc-dark border border-red-500/50 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold text-red-400 mb-4">Delete Account</h3>
        <p class="text-white/80 mb-4">
          Are you sure you want to delete your account? This action will:
        </p>
        <ul class="list-disc list-inside text-sc-grey/70 text-sm space-y-1 mb-6">
          <li>Schedule your account for deletion in 30 days</li>
          <li>Remove all your personal data permanently</li>
          <li>Delete your ships, inventory, and transactions</li>
          <li>Remove your forum posts and messages</li>
        </ul>
        <div class="mb-4">
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Reason (optional)</label>
          <textarea 
            v-model="deletionReason"
            rows="2"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-red-500 focus:outline-none resize-none"
            placeholder="Tell us why you're leaving..."
          ></textarea>
        </div>
        <div class="flex gap-3">
          <button 
            @click="showDeleteModal = false"
            class="flex-1 px-4 py-2 text-sc-grey hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            @click="confirmDeletion"
            :disabled="isLoading"
            class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-bold uppercase tracking-widest text-sm transition-colors"
          >
            {{ isLoading ? 'Processing...' : 'Delete Account' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Cancel Deletion Modal -->
    <div v-if="showCancelModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div class="bg-sc-dark border border-sc-blue/30 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold text-white mb-4">Cancel Account Deletion</h3>
        <p class="text-white/80 mb-6">
          Your account is scheduled for deletion in {{ daysUntilDeletion }} days. You can cancel this request and keep your account.
        </p>
        <div class="flex gap-3">
          <button 
            @click="showCancelModal = false"
            class="flex-1 px-4 py-2 text-sc-grey hover:text-white transition-colors"
          >
            Keep Scheduled
          </button>
          <button 
            @click="confirmCancelDeletion"
            :disabled="isLoading"
            class="flex-1 px-4 py-2 bg-sc-blue hover:bg-sc-light-blue disabled:opacity-50 disabled:cursor-not-allowed text-sc-dark rounded font-bold uppercase tracking-widest text-sm transition-colors"
          >
            {{ isLoading ? 'Processing...' : 'Cancel Deletion' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePrivacyStore } from '../stores/privacy';
import { useRouter } from 'vue-router';

const router = useRouter();
const privacyStore = usePrivacyStore();

const showDeleteModal = ref(false);
const showCancelModal = ref(false);
const deletionReason = ref('');

const settings = computed(() => privacyStore.settings || {
  hide_from_leaderboards: false,
  hide_trade_activity: false,
  hide_achievements: false,
  allow_data_export: true,
});

const isLoading = computed(() => privacyStore.isLoading);
const hasDeletionRequest = computed(() => privacyStore.hasDeletionRequest);
const daysUntilDeletion = computed(() => privacyStore.daysUntilDeletion);

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toggleSetting = async (setting) => {
  const newSettings = { ...settings.value };
  newSettings[setting] = !newSettings[setting];
  
  // Only include the setting being changed
  const updateData = {};
  updateData[setting] = newSettings[setting];
  
  try {
    await privacyStore.updateSettings(updateData);
  } catch (err) {
    // Error handled in store
  }
};

const exportData = async (format) => {
  try {
    await privacyStore.exportData(format);
  } catch (err) {
    // Error handled in store
  }
};

const confirmDeletion = async () => {
  try {
    await privacyStore.requestAccountDeletion(deletionReason.value);
    showDeleteModal.value = false;
    deletionReason.value = '';
  } catch (err) {
    // Error handled in store
  }
};

const confirmCancelDeletion = async () => {
  try {
    await privacyStore.cancelDeletionRequest();
    showCancelModal.value = false;
  } catch (err) {
    // Error handled in store
  }
};

onMounted(async () => {
  await privacyStore.fetchSettings();
  await privacyStore.fetchDeletionStatus();
});
</script>
