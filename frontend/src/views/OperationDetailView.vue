<template>
  <div class="space-y-6">
    <div v-if="isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else-if="operation" class="bg-sc-panel border border-sc-grey/10 rounded-lg shadow-xl p-8">
      <!-- Header -->
      <div class="flex justify-between items-start mb-6">
        <div>
          <h2 class="text-3xl font-bold text-white tracking-wide uppercase italic mb-2">{{ operation.title }}</h2>
          <div class="flex items-center space-x-3 text-sc-grey/70 text-sm">
            <span>{{ operation.type }}</span>
            <span class="w-1 h-1 bg-sc-grey/50 rounded-full"></span>
            <span>Status: <span :class="statusColorClass(operation.status)">{{ operation.status }}</span></span>
            <span class="w-1 h-1 bg-sc-grey/50 rounded-full"></span>
            <span>Created by: {{ operation.creator?.display_name || 'Unknown' }}</span>
          </div>
        </div>
        <div class="flex space-x-2">
          <router-link v-if="isCreator" :to="{ name: 'operation-edit', params: { id: operation.id } }" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">Edit</router-link>
          <button v-if="isCreator" @click="handleDelete" class="px-4 py-2 bg-red-500/10 border border-red-500 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-sc-dark transition-all">Delete</button>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm mb-8">
        <div>
          <div class="text-sc-grey/50 uppercase text-xs font-bold mb-1">Scheduled At</div>
          <p class="text-white">{{ formatDateTime(operation.scheduled_at) }}</p>
        </div>
        <div>
          <div class="text-sc-grey/50 uppercase text-xs font-bold mb-1">Estimated Duration</div>
          <p class="text-white">{{ operation.estimated_duration ? `${operation.estimated_duration} hours` : 'N/A' }}</p>
        </div>
        <div>
          <div class="text-sc-grey/50 uppercase text-xs font-bold mb-1">Max Participants</div>
          <p class="text-white">{{ operation.max_participants || 'Unlimited' }}</p>
        </div>
        <div>
          <div class="text-sc-grey/50 uppercase text-xs font-bold mb-1">Requirements</div>
          <p class="text-white">{{ operation.requirements || 'None' }}</p>
        </div>
        <div>
          <div class="text-sc-grey/50 uppercase text-xs font-bold mb-1">Required Roles</div>
          <p class="text-white">{{ operation.required_roles && operation.required_roles.length > 0 ? operation.required_roles.join(', ') : 'None' }}</p>
        </div>
        <div>
          <div class="text-sc-grey/50 uppercase text-xs font-bold mb-1">Required Ship Types</div>
          <p class="text-white">{{ operation.required_ship_types && operation.required_ship_types.length > 0 ? operation.required_ship_types.join(', ') : 'None' }}</p>
        </div>
      </div>

      <!-- Description -->
      <div v-if="operation.description" class="mb-8">
        <div class="text-sc-grey/50 uppercase text-xs font-bold mb-2">Description</div>
        <p class="text-white leading-relaxed">{{ operation.description }}</p>
      </div>

      <!-- Participation Actions -->
      <div class="border-t border-sc-grey/10 pt-6 flex justify-end space-x-4">
        <button v-if="!isSignedUp && operation.status === 'RECRUITING'" @click="showSignupModal = true" class="px-6 py-2 bg-sc-blue text-sc-dark font-bold uppercase tracking-widest text-xs rounded hover:bg-white transition-all shadow-[0_0_15px_rgba(102,252,241,0.2)]">Sign Up</button>
        <button v-if="isSignedUp" @click="handleCancelSignup" class="px-6 py-2 bg-yellow-500/10 border border-yellow-500 text-yellow-500 font-bold uppercase tracking-widest text-xs rounded hover:bg-yellow-500 hover:text-sc-dark transition-all">Cancel Signup</button>
      </div>

      <!-- Participants -->
      <div class="mt-8 border-t border-sc-grey/10 pt-8">
        <h3 class="text-xl font-bold text-white mb-4">Participants ({{ operation.participants?.length || 0 }})</h3>
        <div v-if="operation.participants && operation.participants.length > 0" class="bg-black/20 rounded-lg overflow-hidden border border-sc-grey/10">
          <ul class="divide-y divide-sc-grey/10">
            <li v-for="participant in operation.participants" :key="participant.user_id" class="p-4 flex justify-between items-center hover:bg-white/5">
              <div>
                <span class="font-bold text-white">{{ participant.user.display_name }}</span>
                <span v-if="participant.role_preference" class="text-sc-grey/70 text-sm ml-2">({{ participant.role_preference }})</span>
              </div>
              <span v-if="participant.ship" class="text-sc-blue text-sm">{{ participant.ship.name }}</span>
              <span v-else class="text-sc-grey/50 text-sm">No ship selected</span>
            </li>
          </ul>
        </div>
        <p v-else class="text-sc-grey/50">No one has signed up for this operation yet.</p>
      </div>
    </div>

    <div v-else class="text-center p-12 text-sc-grey/70">
      <p class="text-xl">Operation not found.</p>
    </div>

    <OperationSignupModal
      :show="showSignupModal"
      :operation-id="operation?.id"
      @close="showSignupModal = false"
      @signed-up="fetchOperation"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import OperationsService from '../services/OperationsService';
import { useAuthStore } from '../stores/auth';
import OperationSignupModal from '../components/OperationSignupModal.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const operation = ref(null);
const isLoading = ref(true);
const showSignupModal = ref(false);

const operationId = computed(() => parseInt(route.params.id));
const currentUserId = computed(() => authStore.user?.id);
const isCreator = computed(() => operation.value?.created_by_id === currentUserId.value);
const isSignedUp = computed(() => 
  operation.value?.participants?.some(p => p.user_id === currentUserId.value)
);

const fetchOperation = async () => {
  isLoading.value = true;
  try {
    operation.value = await OperationsService.getOperation(operationId.value);
  } catch (error) {
    console.error('Failed to fetch operation:', error);
    operation.value = null; // Indicate not found or error
  } finally {
    isLoading.value = false;
  }
};

const handleCancelSignup = async () => {
  if (confirm('Are you sure you want to cancel your signup for this operation?')) {
    try {
      await OperationsService.cancelSignup(operationId.value);
      alert('Signup cancelled successfully!');
      fetchOperation(); // Re-fetch to update participant list
    } catch (error) {
      console.error('Failed to cancel signup:', error);
      alert('Failed to cancel signup.');
    }
  }
};

const handleDelete = async () => {
  if (confirm('Are you sure you want to delete this operation? This action cannot be undone.')) {
    try {
      await OperationsService.deleteOperation(operationId.value);
      alert('Operation deleted successfully!');
      router.push({ name: 'operations' }); // Redirect to operations list
    } catch (error) {
      console.error('Failed to delete operation:', error);
      alert('Failed to delete operation.');
    }
  }
};

const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  const options = {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: true
  };
  return date.toLocaleString(undefined, options);
};

const statusColorClass = (status) => {
  switch (status) {
    case 'RECRUITING': return 'text-green-500';
    case 'PLANNING': return 'text-blue-500';
    case 'IN_PROGRESS': return 'text-yellow-500';
    case 'COMPLETED': return 'text-gray-500';
    case 'CANCELLED': return 'text-red-500';
    default: return 'text-sc-grey';
  }
};

onMounted(fetchOperation);
</script>

<style scoped>
/* Specific styles for OperationDetailView */
</style>
