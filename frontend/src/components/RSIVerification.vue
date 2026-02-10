<template>
  <div class="rsi-verification">
    <!-- Verification Status Card -->
    <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 mb-6">
      <h2 class="text-xl font-bold text-sc-light-blue mb-4 flex items-center">
        <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        RSI Account Verification
      </h2>

      <!-- Verified State -->
      <div v-if="isVerified" class="flex items-center space-x-3">
        <div class="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <div>
          <p class="text-white font-medium">Verified RSI Account</p>
          <a 
            :href="`https://robertsspaceindustries.com/citizens/${rsiHandle}`"
            target="_blank"
            rel="noopener"
            class="text-sc-light-blue hover:text-sc-blue transition-colors"
          >
            {{ rsiHandle }}
            <svg class="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- Pending State -->
      <div v-else-if="hasPendingRequest" class="flex items-center space-x-3">
        <div class="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div>
          <p class="text-white font-medium">Verification Pending</p>
          <p class="text-sc-grey text-sm">
            Your request is being reviewed by an admin
          </p>
        </div>
      </div>

      <!-- Not Verified State -->
      <div v-else class="space-y-4">
        <p class="text-sc-grey">
          Verify your RSI account to display your handle on your profile and prove your identity to other members.
        </p>
        
        <button 
          @click="showVerificationForm = true"
          class="px-4 py-2 bg-sc-blue hover:bg-sc-light-blue text-white rounded-lg transition-colors"
        >
          Start Verification
        </button>
      </div>
    </div>

    <!-- Verification Form Modal -->
    <div v-if="showVerificationForm" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div class="bg-sc-dark border border-sc-blue/30 rounded-lg p-6 max-w-lg w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-white">Verify RSI Account</h3>
          <button @click="showVerificationForm = false" class="text-sc-grey hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <!-- Instructions -->
          <div class="bg-sc-panel/50 rounded-lg p-4 text-sm text-sc-grey">
            <p class="mb-2"><strong class="text-white">How to verify:</strong></p>
            <ol class="list-decimal list-inside space-y-1">
              <li>Go to your RSI profile page</li>
              <li>Take a screenshot showing your handle</li>
              <li>Upload the screenshot to an image host</li>
              <li>Submit the URL below</li>
            </ol>
          </div>

          <!-- RSI Handle Input -->
          <div>
            <label class="block text-sm text-sc-grey mb-1">RSI Handle</label>
            <input 
              v-model="verificationForm.rsi_handle"
              type="text"
              placeholder="Your RSI handle"
              class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white placeholder-sc-grey/50 focus:border-sc-blue focus:outline-none"
            />
          </div>

          <!-- Screenshot URL Input -->
          <div>
            <label class="block text-sm text-sc-grey mb-1">Screenshot URL</label>
            <input 
              v-model="verificationForm.screenshot_url"
              type="url"
              placeholder="https://i.imgur.com/..."
              class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white placeholder-sc-grey/50 focus:border-sc-blue focus:outline-none"
            />
            <p class="text-xs text-sc-grey mt-1">
              Supported hosts: imgur, discord cdn, etc.
            </p>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {{ error }}
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end space-x-3 pt-2">
            <button 
              @click="showVerificationForm = false"
              class="px-4 py-2 text-sc-grey hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              @click="submitVerification"
              :disabled="!canSubmit || isLoading"
              class="px-4 py-2 bg-sc-blue hover:bg-sc-light-blue disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center"
            >
              <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              {{ isLoading ? 'Submitting...' : 'Submit for Review' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="showSuccess" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div class="bg-sc-dark border border-green-500/30 rounded-lg p-6 max-w-md mx-4 text-center">
        <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-white mb-2">Request Submitted!</h3>
        <p class="text-sc-grey mb-4">
          Your RSI verification request has been submitted and is awaiting admin review.
        </p>
        <button 
          @click="showSuccess = false"
          class="px-4 py-2 bg-sc-blue hover:bg-sc-light-blue text-white rounded-lg transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRSIStore } from '../stores/rsi';

const rsiStore = useRSIStore();

const showVerificationForm = ref(false);
const showSuccess = ref(false);
const verificationForm = ref({
  rsi_handle: '',
  screenshot_url: '',
});

const isVerified = computed(() => rsiStore.isVerified);
const rsiHandle = computed(() => rsiStore.rsiHandle);
const hasPendingRequest = computed(() => rsiStore.hasPendingRequest);
const isLoading = computed(() => rsiStore.isLoading);
const error = computed(() => rsiStore.error);

const canSubmit = computed(() => {
  return verificationForm.value.rsi_handle.length >= 3 &&
         verificationForm.value.screenshot_url.length > 10;
});

const submitVerification = async () => {
  try {
    await rsiStore.submitVerification(
      verificationForm.value.rsi_handle,
      verificationForm.value.screenshot_url
    );
    showVerificationForm.value = false;
    showSuccess.value = true;
    verificationForm.value = { rsi_handle: '', screenshot_url: '' };
  } catch (err) {
    // Error is handled in store
  }
};

onMounted(() => {
  rsiStore.fetchVerificationStatus();
});
</script>
