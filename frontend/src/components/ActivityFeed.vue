<template>
  <div class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden">
    <div class="flex justify-between items-center p-4 border-b border-sc-grey/10">
      <h3 class="text-lg font-bold text-white uppercase tracking-widest">Activity Feed</h3>
      <div class="flex items-center gap-3">
        <select v-model="selectedFilter" @change="applyFilter"
          class="bg-black/30 border border-sc-grey/30 rounded px-3 py-1 text-xs text-white focus:border-sc-blue focus:outline-none">
          <option value="">All Activities</option>
          <option v-for="type in activityTypes" :key="type" :value="type">
            {{ formatActivityType(type) }}
          </option>
        </select>
        <button @click="refreshFeed" :disabled="activityStore.isLoading"
          class="text-sc-blue hover:text-white transition-colors disabled:opacity-50">
          <svg class="w-4 h-4" :class="{'animate-spin': activityStore.isLoading}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
      </div>
    </div>

    <div class="max-h-96 overflow-y-auto custom-scrollbar">
      <div v-if="activityStore.isLoading && activityStore.activities.length === 0" class="flex justify-center p-8">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sc-blue"></div>
      </div>

      <div v-else-if="activityStore.activities.length === 0" class="p-8 text-center">
        <p class="text-sc-grey uppercase tracking-widest text-sm">No recent activity</p>
        <p class="text-sc-grey/50 text-xs mt-2">Check back later for updates!</p>
      </div>

      <div v-else class="divide-y divide-sc-grey/10">
        <div v-for="activity in activityStore.activities" :key="activity.id" 
          class="p-4 hover:bg-sc-blue/5 transition-colors">
          <div class="flex gap-3">
            <!-- Activity Icon -->
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-sc-blue/10 flex items-center justify-center">
              <span class="text-lg">{{ getActivityIcon(activity.type) }}</span>
            </div>

            <div class="flex-1 min-w-0">
              <!-- Activity Content -->
              <div class="text-sm text-white">
                <span v-if="activity.user_display_name" class="font-bold text-sc-blue">{{ activity.user_display_name }}</span>
                <span v-else class="text-sc-grey">Someone</span>
                {{ getActivityDescription(activity) }}
              </div>

              <!-- Timestamp -->
              <div class="text-xs text-sc-grey/50 mt-1">
                {{ formatTimeAgo(activity.created_at) }}
              </div>

              <!-- Reactions -->
              <div v-if="activity.reactions?.length > 0" class="flex flex-wrap gap-1 mt-2">
                <button v-for="(count, emoji) in getReactionSummary(activity.reactions)" :key="emoji"
                  @click="toggleReaction(activity.id, emoji)"
                  class="flex items-center gap-1 px-2 py-0.5 bg-sc-blue/10 rounded text-xs hover:bg-sc-blue/20 transition-colors"
                  :class="hasUserReacted(activity.reactions, emoji) ? 'border border-sc-blue' : ''">
                  <span>{{ emoji }}</span>
                  <span class="text-sc-grey">{{ count }}</span>
                </button>
              </div>

              <!-- Add Reaction Button -->
              <div class="mt-2">
                <button @click="showEmojiPicker = showEmojiPicker === activity.id ? null : activity.id"
                  class="text-xs text-sc-grey/50 hover:text-sc-blue transition-colors">
                  + React
                </button>
                
                <!-- Emoji Picker -->
                <div v-if="showEmojiPicker === activity.id" 
                  class="mt-2 p-2 bg-black/50 rounded border border-sc-grey/30 flex flex-wrap gap-1">
                  <button v-for="emoji in commonEmojis" :key="emoji"
                    @click="addReaction(activity.id, emoji)"
                    class="w-8 h-8 hover:bg-sc-blue/20 rounded transition-colors text-lg">
                    {{ emoji }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="activityStore.hasMore" class="p-4 text-center border-t border-sc-grey/10">
        <button @click="loadMore" :disabled="activityStore.isLoading"
          class="text-xs text-sc-blue uppercase tracking-widest hover:text-white transition-colors disabled:opacity-50">
          {{ activityStore.isLoading ? 'Loading...' : 'Load More' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useActivityStore } from '../stores/activity';

const activityStore = useActivityStore();
const selectedFilter = ref('');
const showEmojiPicker = ref(null);
const currentOffset = ref(0);

const commonEmojis = ['👍', '❤️', '🎉', '🚀', '🔥', '👏', '😄', '😮'];

const activityTypes = [
  'member_joined',
  'member_approved',
  'operation_created',
  'operation_completed',
  'ship_added',
  'trade_completed',
  'contract_posted',
  'contract_completed',
  'announcement_posted',
  'project_created',
  'project_completed',
  'contribution_made',
  'lfg_posted',
  'price_reported',
];

const activityIcons = {
  member_joined: '👤',
  member_approved: '✅',
  operation_created: '🎯',
  operation_completed: '🏆',
  ship_added: '🚀',
  trade_completed: '💰',
  contract_posted: '📋',
  contract_completed: '🤝',
  announcement_posted: '📢',
  project_created: '📁',
  project_completed: '⭐',
  contribution_made: '💎',
  lfg_posted: '👥',
  price_reported: '📊',
};

onMounted(() => {
  activityStore.fetchActivityFeed({ limit: 20 });
  activityStore.startPolling(30000); // Poll every 30 seconds
});

onUnmounted(() => {
  activityStore.stopPolling();
});

const getActivityIcon = (type) => {
  return activityIcons[type] || '📌';
};

const getActivityDescription = (activity) => {
  const content = activity.content || {};
  
  switch (activity.type) {
    case 'member_joined':
      return 'joined the organization';
    case 'member_approved':
      return 'was approved as a member';
    case 'operation_created':
      return `created an operation: "${content.title || 'Untitled'}"`;
    case 'operation_completed':
      return `completed an operation: "${content.title || 'Untitled'}"`;
    case 'ship_added':
      return `added a ${content.ship_type || 'ship'} to their fleet`;
    case 'trade_completed':
      return `completed a trade run with ${content.commodity || 'commodity'} (+${content.profit || 0} aUEC)`;
    case 'contract_posted':
      return `posted a cargo contract: ${content.origin || '?'} → ${content.destination || '?'}`;
    case 'contract_completed':
      return `completed a cargo contract (+${content.payment || 0} aUEC)`;
    case 'announcement_posted':
      return `posted an announcement: "${content.title || 'Untitled'}"`;
    case 'project_created':
      return `created a project: "${content.name || 'Untitled'}"`;
    case 'project_completed':
      return `completed a project: "${content.name || 'Untitled'}"`;
    case 'contribution_made':
      return `contributed ${content.amount || 0} aUEC to "${content.project_name || 'a project'}"`;
    case 'lfg_posted':
      return `is looking for crew on a ${content.ship_type || 'ship'} for ${content.activity_type || 'activity'}`;
    case 'price_reported':
      return `reported prices at ${content.location || 'a location'}`;
    default:
      return 'did something';
  }
};

const formatActivityType = (type) => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getReactionSummary = (reactions) => {
  const summary = {};
  reactions.forEach(r => {
    summary[r.emoji] = (summary[r.emoji] || 0) + 1;
  });
  return summary;
};

const hasUserReacted = (reactions, emoji) => {
  // This would need the current user ID to check properly
  // For now, we'll just return false
  return false;
};

const addReaction = async (activityId, emoji) => {
  try {
    await activityStore.addReaction(activityId, emoji);
    showEmojiPicker.value = null;
  } catch (e) {
    // Error handled in store
  }
};

const toggleReaction = async (activityId, emoji) => {
  // In a real implementation, we'd check if the user already reacted
  // For now, just add
  await addReaction(activityId, emoji);
};

const applyFilter = () => {
  currentOffset.value = 0;
  activityStore.fetchActivityFeed({
    type: selectedFilter.value || undefined,
    limit: 20,
  });
};

const refreshFeed = () => {
  currentOffset.value = 0;
  activityStore.fetchActivityFeed({
    type: selectedFilter.value || undefined,
    limit: 20,
  });
};

const loadMore = () => {
  currentOffset.value += 20;
  activityStore.fetchActivityFeed({
    type: selectedFilter.value || undefined,
    limit: 20,
    offset: currentOffset.value,
  });
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-sc-blue/20 rounded;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  @apply bg-sc-blue/40;
}
</style>
