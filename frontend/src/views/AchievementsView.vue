<template>
  <div class="space-y-6">
    <!-- Header with Summary -->
    <div class="flex justify-between items-start">
      <div>
        <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Achievements</h2>
        <p v-if="achievementStore.mySummary" class="text-sc-grey mt-1">
          {{ achievementStore.mySummary.total_achievements }} achievements • {{ achievementStore.mySummary.total_points }} points
        </p>
      </div>
      <button 
        @click="checkForAchievements"
        :disabled="checking"
        class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all disabled:opacity-50"
      >
        {{ checking ? 'Checking...' : 'Check for New' }}
      </button>
    </div>

    <!-- Rarity Breakdown -->
    <div v-if="achievementStore.mySummary" class="grid grid-cols-4 gap-4">
      <div class="bg-sc-panel border border-sc-grey/10 p-4 rounded text-center">
        <div class="text-2xl font-bold text-sc-blue">{{ achievementStore.mySummary.by_rarity.common || 0 }}</div>
        <div class="text-xs text-sc-grey uppercase tracking-widest">Common</div>
      </div>
      <div class="bg-sc-panel border border-sc-grey/10 p-4 rounded text-center">
        <div class="text-2xl font-bold text-blue-400">{{ achievementStore.mySummary.by_rarity.rare || 0 }}</div>
        <div class="text-xs text-sc-grey uppercase tracking-widest">Rare</div>
      </div>
      <div class="bg-sc-panel border border-sc-grey/10 p-4 rounded text-center">
        <div class="text-2xl font-bold text-purple-400">{{ achievementStore.mySummary.by_rarity.epic || 0 }}</div>
        <div class="text-xs text-sc-grey uppercase tracking-widest">Epic</div>
      </div>
      <div class="bg-sc-panel border border-sc-grey/10 p-4 rounded text-center">
        <div class="text-2xl font-bold text-yellow-400">{{ achievementStore.mySummary.by_rarity.legendary || 0 }}</div>
        <div class="text-xs text-sc-grey uppercase tracking-widest">Legendary</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-sc-grey/20">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id" 
        :class="activeTab === tab.id ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey'"
        class="px-6 py-3 border-b-2 text-xs uppercase tracking-widest font-bold transition-colors"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- My Achievements Tab -->
    <div v-if="activeTab === 'my'" class="space-y-4">
      <div v-if="achievementStore.isLoading" class="flex justify-center p-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
      </div>

      <div v-else-if="achievementStore.myAchievements.length === 0" class="bg-sc-panel border border-sc-grey/10 p-12 text-center">
        <p class="text-sc-grey uppercase tracking-widest">No achievements yet</p>
        <p class="text-sc-grey/50 text-sm mt-2">Complete activities to earn achievements!</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="userAchievement in achievementStore.myAchievements" 
          :key="userAchievement.id"
          class="bg-sc-panel border rounded-lg p-4 transition-all"
          :class="getRarityBorderClass(userAchievement.achievement.rarity)"
        >
          <div class="flex items-start gap-3">
            <div class="text-4xl">{{ userAchievement.achievement.icon || '🏆' }}</div>
            <div class="flex-1">
              <div class="font-bold text-white">{{ userAchievement.achievement.name }}</div>
              <div class="text-sm text-sc-grey mt-1">{{ userAchievement.achievement.description }}</div>
              <div class="flex items-center gap-2 mt-2">
                <span :class="getRarityTextClass(userAchievement.achievement.rarity)" class="text-xs uppercase font-bold">
                  {{ userAchievement.achievement.rarity }}
                </span>
                <span class="text-xs text-sc-grey">• {{ userAchievement.achievement.points }} pts</span>
              </div>
              <div class="text-xs text-sc-grey/50 mt-2">
                Earned {{ formatTimeAgo(userAchievement.awarded_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Available Achievements Tab -->
    <div v-if="activeTab === 'available'" class="space-y-4">
      <div v-if="achievementStore.isLoading" class="flex justify-center p-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="achievement in availableAchievements" 
          :key="achievement.id"
          class="bg-sc-panel border rounded-lg p-4 transition-all"
          :class="getRarityBorderClass(achievement.rarity)"
        >
          <div class="flex items-start gap-3">
            <div class="text-4xl opacity-50">{{ achievement.icon || '🏆' }}</div>
            <div class="flex-1">
              <div class="font-bold text-white opacity-70">{{ achievement.name }}</div>
              <div class="text-sm text-sc-grey mt-1">{{ achievement.description }}</div>
              <div class="flex items-center gap-2 mt-2">
                <span :class="getRarityTextClass(achievement.rarity)" class="text-xs uppercase font-bold opacity-70">
                  {{ achievement.rarity }}
                </span>
                <span class="text-xs text-sc-grey">• {{ achievement.points }} pts</span>
              </div>
              <div v-if="achievement.earned_count > 0" class="text-xs text-sc-grey/50 mt-2">
                {{ achievement.earned_count }} members earned
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Leaderboard Tab -->
    <div v-if="activeTab === 'leaderboard'" class="space-y-4">
      <div v-if="achievementStore.leaderboard.length === 0" class="flex justify-center p-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
      </div>

      <div v-else class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden">
        <table class="w-full">
          <thead class="bg-black/30">
            <tr>
              <th class="text-left p-4 text-xs text-sc-grey uppercase tracking-widest">Rank</th>
              <th class="text-left p-4 text-xs text-sc-grey uppercase tracking-widest">Citizen</th>
              <th class="text-left p-4 text-xs text-sc-grey uppercase tracking-widest">Achievements</th>
              <th class="text-left p-4 text-xs text-sc-grey uppercase tracking-widest">Points</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-sc-grey/10">
            <tr v-for="entry in achievementStore.leaderboard" :key="entry.user_id" class="hover:bg-sc-blue/5">
              <td class="p-4">
                <span :class="getRankClass(entry.rank)" class="font-bold text-lg">#{{ entry.rank }}</span>
              </td>
              <td class="p-4 text-white font-medium">{{ entry.display_name || `User ${entry.user_id}` }}</td>
              <td class="p-4 text-sc-grey">{{ entry.total_achievements }}</td>
              <td class="p-4">
                <span class="text-sc-blue font-bold">{{ entry.total_points }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- New Achievement Modal -->
    <div v-if="newAchievements.length > 0" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div class="bg-sc-panel border-2 border-yellow-400/50 rounded-lg p-8 w-full max-w-md shadow-2xl text-center">
        <div class="text-6xl mb-4">🎉</div>
        <h3 class="text-2xl font-bold text-white uppercase tracking-widest mb-2">Achievement Unlocked!</h3>
        
        <div v-for="achievement in newAchievements" :key="achievement.id" class="my-6">
          <div class="text-5xl mb-3">{{ achievement.achievement.icon || '🏆' }}</div>
          <div class="text-xl font-bold text-white">{{ achievement.achievement.name }}</div>
          <div class="text-sc-grey mt-1">{{ achievement.achievement.description }}</div>
          <div :class="getRarityTextClass(achievement.achievement.rarity)" class="text-sm uppercase font-bold mt-2">
            {{ achievement.achievement.rarity }}
          </div>
          <div class="text-sc-blue font-bold mt-1">+{{ achievement.achievement.points }} points</div>
        </div>

        <button 
          @click="newAchievements = []"
          class="px-6 py-3 bg-sc-blue/10 border border-sc-blue text-sc-blue hover:bg-sc-blue/20 transition-all text-sm uppercase tracking-widest"
        >
          Awesome!
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAchievementStore } from '../stores/achievement';

const achievementStore = useAchievementStore();
const activeTab = ref('my');
const checking = ref(false);
const newAchievements = ref([]);

const tabs = [
  { id: 'my', label: 'My Achievements' },
  { id: 'available', label: 'Available' },
  { id: 'leaderboard', label: 'Leaderboard' },
];

const availableAchievements = computed(() => {
  const earnedIds = new Set(achievementStore.myAchievements.map(ua => ua.achievement_id));
  return achievementStore.achievements.filter(a => !earnedIds.has(a.id));
});

onMounted(() => {
  achievementStore.fetchMyAchievements();
  achievementStore.fetchMySummary();
  achievementStore.fetchAchievements();
  achievementStore.fetchLeaderboard();
});

const checkForAchievements = async () => {
  checking.value = true;
  const awarded = await achievementStore.checkAchievements();
  if (awarded.length > 0) {
    newAchievements.value = awarded;
  }
  checking.value = false;
};

const getRarityBorderClass = (rarity) => {
  switch (rarity) {
    case 'common': return 'border-sc-grey/30';
    case 'rare': return 'border-blue-400/30';
    case 'epic': return 'border-purple-400/30';
    case 'legendary': return 'border-yellow-400/50';
    default: return 'border-sc-grey/30';
  }
};

const getRarityTextClass = (rarity) => {
  switch (rarity) {
    case 'common': return 'text-sc-grey';
    case 'rare': return 'text-blue-400';
    case 'epic': return 'text-purple-400';
    case 'legendary': return 'text-yellow-400';
    default: return 'text-sc-grey';
  }
};

const getRankClass = (rank) => {
  switch (rank) {
    case 1: return 'text-yellow-400';
    case 2: return 'text-gray-300';
    case 3: return 'text-amber-600';
    default: return 'text-sc-grey';
  }
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};
</script>
