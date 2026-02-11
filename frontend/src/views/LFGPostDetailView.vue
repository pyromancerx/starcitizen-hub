<template>
  <div class="space-y-6">
    <div v-if="isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else-if="lfgPost" class="bg-sc-panel border border-sc-grey/10 rounded-lg shadow-xl p-8">
      <!-- Header -->
      <div class="flex justify-between items-start mb-6">
        <div>
          <h2 class="text-3xl font-bold text-white tracking-wide uppercase italic mb-2">{{ lfgPost.ship_type }} - {{ lfgPost.activity_type }}</h2>
          <div class="flex items-center space-x-3 text-sc-grey/70 text-sm">
            <span>Status: <span :class="statusClass(lfgPost.status)">{{ lfgPost.status }}</span></span>
            <span class="w-1 h-1 bg-sc-grey/50 rounded-full"></span>
            <span>Posted by: {{ lfgPost.user_display_name || 'Unknown' }}</span>
            <span class="w-1 h-1 bg-sc-grey/50 rounded-full"></span>
            <span>{{ formatTimeAgo(lfgPost.created_at) }}</span>
          </div>
        </div>
        <div class="flex space-x-2">
          <button v-if="isCreator && lfgPost.status === 'open'" @click="openEditModal" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">Edit</button>
          <button v-if="isCreator && lfgPost.status === 'open'" @click="markFilled" class="px-4 py-2 bg-green-500/10 border border-green-500 text-green-500 text-xs font-bold uppercase tracking-widest hover:bg-green-500 hover:text-sc-dark transition-all">Mark Filled</button>
          <button v-if="isCreator && lfgPost.status === 'open'" @click="cancelPost" class="px-4 py-2 bg-red-500/10 border border-red-500 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-sc-dark transition-all">Cancel</button>
          <button v-if="!isCreator && lfgPost.status === 'open'" @click="openRespondModal" class="px-4 py-2 bg-sc-blue text-sc-dark font-bold uppercase tracking-widest text-xs rounded hover:bg-white transition-all shadow-[0_0_15px_rgba(102,252,241,0.2)]">Respond</button>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm mb-8">
        <div>
          <div class="text-sc-grey/50 uppercase text-xs font-bold mb-1">Looking For</div>
          <p class="text-white">
            <span v-if="lfgPost.looking_for_roles && lfgPost.looking_for_roles.length > 0">{{ lfgPost.looking_for_roles.join(', ') }}</span>
            <span v-else>Any roles</span>
          </p>
        </div>
        <div>
          <div class="text-sc-grey/50 uppercase text-xs font-bold mb-1">Scheduled Time</div>
          <p class="text-white">{{ lfgPost.scheduled_time ? formatDateTime(lfgPost.scheduled_time) : 'Immediate' }}</p>
        </div>
        <div>
          <div class="text-sc-grey/50 uppercase text-xs font-bold mb-1">Estimated Duration</div>
          <p class="text-white">{{ lfgPost.duration_estimate ? `${lfgPost.duration_estimate} minutes` : 'N/A' }}</p>
        </div>
        <div>
          <div class="text-sc-grey/50 uppercase text-xs font-bold mb-1">Expires At</div>
          <p class="text-white">{{ lfgPost.expires_at ? formatDateTime(lfgPost.expires_at) : 'N/A' }}</p>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="lfgPost.notes" class="mb-8">
        <div class="text-sc-grey/50 uppercase text-xs font-bold mb-2">Notes</div>
        <p class="text-white leading-relaxed">{{ lfgPost.notes }}</p>
      </div>

      <!-- Responses Section (only for creator) -->
      <div v-if="isCreator && lfgResponses.length > 0" class="mt-8 border-t border-sc-grey/10 pt-8">
        <h3 class="text-xl font-bold text-white mb-4">Responses ({{ lfgResponses.length }})</h3>
        <div class="bg-black/20 rounded-lg overflow-hidden border border-sc-grey/10">
          <ul class="divide-y divide-sc-grey/10">
            <li v-for="response in lfgResponses" :key="response.id" class="p-4 hover:bg-white/5">
              <div class="flex justify-between items-center">
                <span class="font-bold text-white">{{ response.user_display_name || 'Unknown' }}</span>
                <span class="text-sc-grey/70 text-xs">{{ formatTimeAgo(response.created_at) }}</span>
              </div>
              <p v-if="response.role_offered" class="text-sc-blue text-sm mt-1">Role: {{ response.role_offered }}</p>
              <p v-if="response.message" class="text-sc-grey/70 text-sm mt-1">{{ response.message }}</p>
            </li>
          </ul>
        </div>
      </div>
      <div v-else-if="isCreator" class="mt-8 border-t border-sc-grey/10 pt-8 text-sc-grey/50">
        No responses to this LFG post yet.
      </div>
    </div>

    <div v-else class="text-center p-12 text-sc-grey/70">
      <p class="text-xl">LFG post not found.</p>
    </div>

    <AddEditLFGPostModal
      :show="showAddEditModal"
      :lfg-post="editingLFGPost"
      @close="showAddEditModal = false"
      @lfg-post-saved="handleLFGPostSaved"
    />

    <RespondToLFGModal
      :show="showRespondModal"
      :lfg-post="lfgPost"
      @close="showRespondModal = false"
      @response-sent="handleResponseSent"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCrewStore } from '../stores/crew';
import { useAuthStore } from '../stores/auth';
import AddEditLFGPostModal from '../components/AddEditLFGPostModal.vue';
import RespondToLFGModal from '../components/RespondToLFGModal.vue';

const route = useRoute();
const router = useRouter();
const crewStore = useCrewStore();
const authStore = useAuthStore();

const lfgPost = ref(null);
const isLoading = ref(true);
const lfgResponses = ref([]);

const showAddEditModal = ref(false);
const editingLFGPost = ref(null);
const showRespondModal = ref(false);

const postId = computed(() => parseInt(route.params.id));
const currentUserId = computed(() => authStore.user?.id);
const isCreator = computed(() => lfgPost.value?.user_id === currentUserId.value);

const fetchLFGPost = async () => {
  isLoading.value = true;
  try {
    lfgPost.value = await crewStore.getLfgPost(postId.value);
    if (isCreator.value) {
      // Only fetch responses if the current user is the creator
      lfgResponses.value = await crewStore.getLfgPostResponses(postId.value);
    }
  } catch (error) {
    console.error('Failed to fetch LFG post:', error);
    lfgPost.value = null; // Indicate not found or error
  } finally {
    isLoading.value = false;
  }
};

const openEditModal = () => {
  editingLFGPost.value = { ...lfgPost.value };
  showAddEditModal.value = true;
};

const markFilled = async () => {
  if (confirm('Are you sure you want to mark this LFG post as filled?')) {
    try {
      await crewStore.markPostFilled(postId.value);
      alert('LFG post marked as filled!');
      fetchLFGPost(); // Refresh status
    } catch (error) {
      console.error('Failed to mark LFG post as filled:', error);
      alert('Failed to mark LFG post as filled.');
    }
  }
};

const cancelPost = async () => {
  if (confirm('Are you sure you want to cancel this LFG post?')) {
    try {
      await crewStore.cancelLfgPost(postId.value);
      alert('LFG post cancelled!');
      router.push({ name: 'crew-finder' }); // Redirect to LFG list
    } catch (error) {
      console.error('Failed to cancel LFG post:', error);
      alert('Failed to cancel LFG post.');
    }
  }
};

const openRespondModal = () => {
  showRespondModal.value = true;
};

const handleLFGPostSaved = () => {
  showAddEditModal.value = false;
  editingLFGPost.value = null;
  fetchLFGPost(); // Refresh the detail view
};

const handleResponseSent = () => {
  showRespondModal.value = false;
  // Re-fetch responses if creator
  if (isCreator.value) {
    fetchLFGPost();
  }
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
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

const statusClass = (status) => {
  switch (status) {
    case 'open': return 'text-green-400';
    case 'filled': return 'text-orange-500';
    case 'cancelled': return 'text-red-500';
    default: return 'text-sc-grey';
  }
};

onMounted(fetchLFGPost);
</script>

<style scoped>
/* Specific styles for LFGPostDetailView */
</style>
