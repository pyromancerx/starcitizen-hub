<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Crew Finder (LFG)</h2>
      <button @click="showAddEditModal = true; editingLFGPost = null" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
        Post LFG
      </button>
    </div>

    <!-- Stats -->
    <div v-if="crewStore.lfgStats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-sc-panel border border-sc-grey/10 p-4 rounded">
        <div class="text-xs text-sc-grey/50 uppercase tracking-widest">Open Posts</div>
        <div class="text-2xl font-bold text-sc-blue">{{ crewStore.lfgStats.open_posts }}</div>
      </div>
      <div v-for="(count, activity) in crewStore.lfgStats.by_activity_type" :key="activity" 
        class="bg-sc-panel border border-sc-grey/10 p-4 rounded">
        <div class="text-xs text-sc-grey/50 uppercase tracking-widest">{{ activity }}</div>
        <div class="text-2xl font-bold text-sc-light-blue">{{ count }}</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-sc-grey/20">
      <button 
        @click="activeTab = 'open'" 
        :class="activeTab === 'open' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey'"
        class="px-6 py-3 border-b-2 text-xs uppercase tracking-widest font-bold transition-colors">
        Open Posts
      </button>
      <button 
        @click="activeTab = 'my'" 
        :class="activeTab === 'my' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey'"
        class="px-6 py-3 border-b-2 text-xs uppercase tracking-widest font-bold transition-colors">
        My Posts
      </button>
    </div>

    <!-- Filters -->
    <div v-if="activeTab === 'open'" class="flex gap-4">
      <select v-model="filters.activity_type" @change="fetchPosts" 
        class="bg-sc-panel border border-sc-grey/30 rounded px-4 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
        <option value="">All Activities</option>
        <option value="mining">Mining</option>
        <option value="cargo">Cargo</option>
        <option value="combat">Combat</option>
        <option value="exploration">Exploration</option>
        <option value="salvage">Salvage</option>
        <option value="social">Social</option>
      </select>
      <input v-model="filters.ship_type" @input="debouncedFetch" type="text" placeholder="Filter by ship type..."
        class="flex-1 bg-sc-panel border border-sc-grey/30 rounded px-4 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
    </div>

    <div v-if="crewStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else>
      <!-- Open Posts -->
      <div v-if="activeTab === 'open'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-if="crewStore.lfgPosts.length === 0" class="col-span-full bg-sc-panel border border-sc-grey/10 p-12 text-center">
          <p class="text-sc-grey uppercase tracking-widest">No open LFG posts.</p>
          <p class="text-sc-grey/50 text-sm mt-2">Be the first to look for crew!</p>
        </div>
        
        <div v-for="post in crewStore.lfgPosts" :key="post.id" 
          class="bg-sc-panel border border-sc-grey/10 rounded-lg p-4 hover:border-sc-blue/30 transition-all">
          <div class="flex justify-between items-start mb-3">
            <span class="text-xs text-green-400 uppercase tracking-widest font-bold">{{ post.status }}</span>
            <span class="text-xs text-sc-grey">{{ formatTimeAgo(post.created_at) }}</span>
          </div>
          
          <div class="mb-3">
            <router-link :to="{ name: 'lfg-post-detail', params: { id: post.id } }" class="text-lg font-bold text-white hover:text-sc-blue">{{ post.ship_type }}</router-link>
            <div class="text-sm text-sc-blue">{{ post.activity_type }}</div>
          </div>
          
          <div class="space-y-2 mb-4">
            <div v-if="post.looking_for_roles?.length" class="flex flex-wrap gap-1">
              <span v-for="role in post.looking_for_roles" :key="role" 
                class="text-[10px] bg-sc-blue/10 text-sc-blue px-2 py-1 rounded uppercase tracking-wider">
                {{ role }}
              </span>
            </div>
            <div v-if="post.scheduled_time" class="text-sm text-sc-grey">
              Scheduled: {{ formatDateTime(post.scheduled_time) }}
            </div>
            <div v-if="post.duration_estimate" class="text-sm text-sc-grey">
              Duration: {{ post.duration_estimate }} min
            </div>
            <div v-if="post.notes" class="text-sm text-sc-grey/70 mt-2">
              {{ post.notes }}
            </div>
          </div>
          
          <div class="flex items-center justify-between pt-3 border-t border-sc-grey/10">
            <span class="text-xs text-sc-grey">by {{ post.user_display_name || 'Unknown' }}</span>
            <button @click="openRespondModal(post)" 
              class="px-3 py-1.5 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
              Respond
            </button>
          </div>
        </div>
      </div>

      <!-- My Posts -->
      <div v-if="activeTab === 'my'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-if="crewStore.myLfgPosts.length === 0" class="col-span-full bg-sc-panel border border-sc-grey/10 p-12 text-center">
          <p class="text-sc-grey uppercase tracking-widest">You haven't posted any LFGs.</p>
        </div>
        
        <div v-for="post in crewStore.myLfgPosts" :key="post.id" 
          class="bg-sc-panel border border-sc-blue/20 rounded-lg p-4">
          <div class="flex justify-between items-start mb-3">
            <span :class="post.status === 'open' ? 'text-green-400' : 'text-sc-grey'" 
              class="text-xs uppercase tracking-widest font-bold">{{ post.status }}</span>
            <div class="flex gap-2">
              <button v-if="post.status === 'open'" @click="openEditModal(post)"
                class="text-xs text-yellow-500 hover:text-yellow-400 transition-colors">
                Edit
              </button>
              <button v-if="post.status === 'open'" @click="markFilled(post.id)"
                class="text-xs text-sc-blue hover:text-white transition-colors">
                Mark Filled
              </button>
              <button v-if="post.status === 'open'" @click="cancelPost(post.id)"
                class="text-xs text-red-500 hover:text-red-400 transition-colors">
                Cancel
              </button>
            </div>
          </div>
          
          <div class="mb-3">
            <router-link :to="{ name: 'lfg-post-detail', params: { id: post.id } }" class="text-lg font-bold text-white hover:text-sc-blue">{{ post.ship_type }}</router-link>
            <div class="text-sm text-sc-blue">{{ post.activity_type }}</div>
          </div>
          
          <div class="space-y-2 mb-4">
            <div v-if="post.looking_for_roles?.length" class="flex flex-wrap gap-1">
              <span v-for="role in post.looking_for_roles" :key="role" 
                class="text-[10px] bg-sc-blue/10 text-sc-blue px-2 py-1 rounded uppercase tracking-wider">
                {{ role }}
              </span>
            </div>
            <div v-if="post.response_count > 0" class="text-sm text-green-400">
              {{ post.response_count }} response(s)
            </div>
          </div>
          
          <div class="text-xs text-sc-grey">
            Posted {{ formatTimeAgo(post.created_at) }}
          </div>
        </div>
      </div>
    </div>

    <AddEditLFGPostModal
      :show="showAddEditModal"
      :lfg-post="editingLFGPost"
      @close="showAddEditModal = false"
      @lfg-post-saved="handleLFGPostSaved"
    />

    <RespondToLFGModal
      :show="showRespondModal"
      :lfg-post="respondingLFGPost"
      @close="showRespondModal = false"
      @response-sent="handleResponseSent"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useCrewStore } from '../stores/crew';
import { useRouter } from 'vue-router'; // Import useRouter
import AddEditLFGPostModal from '../components/AddEditLFGPostModal.vue';
import RespondToLFGModal from '../components/RespondToLFGModal.vue';

const crewStore = useCrewStore();
const router = useRouter(); // Initialize useRouter

const activeTab = ref('open');
const showAddEditModal = ref(false);
const editingLFGPost = ref(null);
const showRespondModal = ref(false);
const respondingLFGPost = ref(null); // The post being responded to

const filters = ref({
  activity_type: '',
  ship_type: ''
});

let debounceTimer;

onMounted(() => {
  crewStore.fetchLfgPosts();
  crewStore.fetchMyLfgPosts();
  crewStore.fetchLfgStats();
});

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

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const debouncedFetch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchPosts();
  }, 300);
};

const fetchPosts = () => {
  crewStore.fetchLfgPosts(filters.value);
};

const openEditModal = (post) => {
  editingLFGPost.value = { ...post };
  showAddEditModal.value = true;
};

const openRespondModal = (post) => {
  respondingLFGPost.value = post;
  showRespondModal.value = true;
};

const handleLFGPostSaved = () => {
  showAddEditModal.value = false;
  editingLFGPost.value = null; // Clear editing state
  crewStore.fetchLfgPosts();
  crewStore.fetchMyLfgPosts();
  crewStore.fetchLfgStats();
};

const handleResponseSent = () => {
  showRespondModal.value = false;
  respondingLFGPost.value = null; // Clear responding state
  // Refresh post details if on detail page, or just refresh my LFG posts
  crewStore.fetchMyLfgPosts(); // To see updated response count
};

const markFilled = async (postId) => {
  if (confirm('Are you sure you want to mark this LFG post as filled?')) {
    try {
      await crewStore.markPostFilled(postId);
      alert('LFG post marked as filled!');
      crewStore.fetchLfgPosts(); // Refresh open posts
      crewStore.fetchMyLfgPosts(); // Refresh my posts
      crewStore.fetchLfgStats(); // Refresh stats
    } catch (e) {
      console.error('Failed to mark LFG post as filled:', e);
      alert('Failed to mark LFG post as filled.');
    }
  }
};

const cancelPost = async (postId) => {
  if (confirm('Are you sure you want to cancel this LFG post?')) {
    try {
      await crewStore.cancelLfgPost(postId);
      alert('LFG post cancelled!');
      crewStore.fetchLfgPosts(); // Refresh open posts
      crewStore.fetchMyLfgPosts(); // Refresh my posts
      crewStore.fetchLfgStats(); // Refresh stats
    } catch (e) {
      console.error('Failed to cancel LFG post:', e);
      alert('Failed to cancel LFG post.');
    }
  }
};
</script>
