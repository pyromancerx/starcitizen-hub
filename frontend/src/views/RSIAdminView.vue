<template>
  <div class="rsi-admin">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-white">RSI Verification Requests</h1>
      <span v-if="pendingCount > 0" class="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
        {{ pendingCount }} pending
      </span>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-sc-blue"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="pendingRequests.length === 0" class="text-center py-12">
      <div class="w-16 h-16 rounded-full bg-sc-panel flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-sc-grey" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <p class="text-sc-grey">No pending verification requests</p>
    </div>

    <!-- Requests List -->
    <div v-else class="space-y-4">
      <div 
        v-for="request in pendingRequests" 
        :key="request.id"
        class="bg-sc-panel border border-sc-grey/20 rounded-lg p-6"
      >
        <div class="flex flex-col md:flex-row md:items-start gap-6">
          <!-- Screenshot -->
          <div class="flex-shrink-0">
            <a 
              :href="request.screenshot_url" 
              target="_blank"
              rel="noopener"
              class="block w-64 h-40 bg-sc-dark rounded-lg overflow-hidden border border-sc-grey/30 hover:border-sc-blue transition-colors"
            >
              <img 
                :src="request.screenshot_url" 
                alt="Verification Screenshot"
                class="w-full h-full object-cover"
                @error="$event.target.src = '/placeholder-image.png'"
              />
            </a>
          </div>

          <!-- Request Details -->
          <div class="flex-grow space-y-3">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-lg font-semibold text-white">{{ request.rsi_handle }}</h3>
                <p class="text-sm text-sc-grey">
                  Submitted {{ formatDate(request.submitted_at) }}
                </p>
              </div>
              <span class="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                Pending
              </span>
            </div>

            <!-- Verification Code -->
            <div class="bg-sc-dark/50 rounded-lg p-3">
              <p class="text-xs text-sc-grey mb-1">Verification Code</p>
              <p class="text-sc-light-blue font-mono text-sm">{{ request.verification_code }}</p>
            </div>

            <!-- Admin Notes -->
            <div>
              <label class="block text-sm text-sc-grey mb-1">Admin Notes (optional)</label>
              <textarea 
                v-model="reviewNotes[request.id]"
                rows="2"
                placeholder="Reason for rejection, or other notes..."
                class="w-full px-3 py-2 bg-sc-dark border border-sc-grey/30 rounded-lg text-white text-sm focus:border-sc-blue focus:outline-none resize-none"
              ></textarea>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button 
                @click="approveRequest(request.id)"
                :disabled="processing[request.id]"
                class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <svg v-if="processing[request.id] === 'approve'" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Approve
              </button>
              <button 
                @click="rejectRequest(request.id)"
                :disabled="processing[request.id]"
                class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <svg v-if="processing[request.id] === 'reject'" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRSIStore } from '../stores/rsi';

const rsiStore = useRSIStore();

const reviewNotes = ref({});
const processing = ref({});

const pendingRequests = computed(() => rsiStore.pendingRequests);
const isLoading = computed(() => rsiStore.isLoading);
const pendingCount = computed(() => pendingRequests.value.length);

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const approveRequest = async (requestId) => {
  processing.value[requestId] = 'approve';
  try {
    await rsiStore.reviewRequest(
      requestId,
      true,
      reviewNotes.value[requestId]
    );
    delete reviewNotes.value[requestId];
  } finally {
    delete processing.value[requestId];
  }
};

const rejectRequest = async (requestId) => {
  processing.value[requestId] = 'reject';
  try {
    await rsiStore.reviewRequest(
      requestId,
      false,
      reviewNotes.value[requestId]
    );
    delete reviewNotes.value[requestId];
  } finally {
    delete processing.value[requestId];
  }
};

onMounted(() => {
  rsiStore.fetchPendingRequests();
});
</script>
