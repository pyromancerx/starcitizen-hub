<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Trade Run Tracker</h2>
      <button @click="showAddEditModal = true; editingTradeRun = null" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
        Log Trade Run
      </button>
    </div>

    <!-- Stats Cards -->
    <div v-if="tradeStore.tradeStats" class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-sc-panel border border-sc-grey/10 p-4 rounded">
        <div class="text-xs text-sc-grey/50 uppercase tracking-widest">Total Profit</div>
        <div class="text-2xl font-bold text-green-400">{{ formatAUEC(tradeStore.tradeStats.total_profit) }}</div>
      </div>
      <div class="bg-sc-panel border border-sc-grey/10 p-4 rounded">
        <div class="text-xs text-sc-grey/50 uppercase tracking-widest">Total Runs</div>
        <div class="text-2xl font-bold text-sc-blue">{{ tradeStore.tradeStats.total_runs }}</div>
      </div>
      <div class="bg-sc-panel border border-sc-grey/10 p-4 rounded">
        <div class="text-xs text-sc-grey/50 uppercase tracking-widest">Avg Profit/Run</div>
        <div class="text-2xl font-bold text-sc-light-blue">{{ formatAUEC(tradeStore.tradeStats.avg_profit_per_run) }}</div>
      </div>
      <div class="bg-sc-panel border border-sc-grey/10 p-4 rounded">
        <div class="text-xs text-sc-grey/50 uppercase tracking-widest">Best Commodity</div>
        <div class="text-2xl font-bold text-sc-blue">{{ tradeStore.tradeStats.best_commodity || 'N/A' }}</div>
      </div>
    </div>

    <!-- My Trade Runs -->
    <div v-if="tradeStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else class="space-y-6">
      <div class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden">
        <h3 class="p-4 text-lg font-bold text-white uppercase tracking-widest border-b border-sc-grey/10">My Trade Runs</h3>
        <table class="w-full">
          <thead class="bg-black/30">
            <tr>
              <th class="text-left p-4 text-xs text-sc-grey uppercase tracking-widest">Route</th>
              <th class="text-left p-4 text-xs text-sc-grey uppercase tracking-widest">Commodity</th>
              <th class="text-left p-4 text-xs text-sc-grey uppercase tracking-widest">Quantity</th>
              <th class="text-left p-4 text-xs text-sc-grey uppercase tracking-widest">Profit</th>
              <th class="text-left p-4 text-xs text-sc-grey uppercase tracking-widest">Date</th>
              <th class="text-right p-4 text-xs text-sc-grey uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-sc-grey/10">
            <tr v-if="tradeStore.tradeRuns.length === 0">
              <td colspan="6" class="p-4 text-center text-sc-grey/50">No trade runs logged yet.</td>
            </tr>
            <tr v-for="run in tradeStore.tradeRuns" :key="run.id" class="hover:bg-sc-blue/5 transition-colors">
              <td class="p-4">
                <div class="text-sm text-white">{{ run.origin_location }} →</div>
                <div class="text-sm text-sc-grey">{{ run.destination_location }}</div>
              </td>
              <td class="p-4 text-sm text-white">{{ run.commodity }}</td>
              <td class="p-4 text-sm text-sc-grey">{{ run.quantity }} SCU</td>
              <td class="p-4">
                <span :class="run.profit >= 0 ? 'text-green-400' : 'text-red-400'" class="font-bold">
                  {{ formatAUEC(run.profit) }}
                </span>
              </td>
              <td class="p-4 text-sm text-sc-grey">{{ formatDate(run.completed_at) }}</td>
              <td class="p-4 text-right">
                <router-link :to="{ name: 'trade-run-detail', params: { id: run.id } }" class="text-sc-blue hover:text-white text-xs uppercase tracking-widest mr-4">View</router-link>
                <button @click="openEditModal(run)" class="text-yellow-500 hover:text-yellow-400 text-xs uppercase tracking-widest mr-4">
                  Edit
                </button>
                <button @click="deleteRun(run.id)" class="text-red-500 hover:text-red-400 text-xs uppercase tracking-widest">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Trade Leaderboard -->
      <div class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden">
        <h3 class="p-4 text-lg font-bold text-white uppercase tracking-widest border-b border-sc-grey/10">Trade Leaderboard</h3>
        <table class="w-full">
          <thead class="bg-black/30">
            <tr>
              <th class="text-left p-4 text-xs text-sc-grey uppercase tracking-widest">Rank</th>
              <th class="text-left p-4 text-xs text-sc-grey uppercase tracking-widest">Pilot</th>
              <th class="text-right p-4 text-xs text-sc-grey uppercase tracking-widest">Total Profit</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-sc-grey/10">
            <tr v-if="tradeStore.leaderboard.length === 0">
              <td colspan="3" class="p-4 text-center text-sc-grey/50">No leaderboard data available.</td>
            </tr>
            <tr v-for="(entry, index) in tradeStore.leaderboard" :key="entry.user_id" class="hover:bg-sc-blue/5 transition-colors">
              <td class="p-4 text-sm text-white">{{ index + 1 }}</td>
              <td class="p-4 text-sm text-white">{{ entry.user_display_name }}</td>
              <td class="p-4 text-right font-bold text-green-400">{{ formatAUEC(entry.total_profit) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AddEditTradeRunModal
      :show="showAddEditModal"
      :trade-run="editingTradeRun"
      @close="showAddEditModal = false"
      @trade-run-saved="handleTradeRunSaved"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTradeStore } from '../stores/trade';
import AddEditTradeRunModal from '../components/AddEditTradeRunModal.vue';
import { useRouter } from 'vue-router'; // Import useRouter

const tradeStore = useTradeStore();
const router = useRouter(); // Initialize useRouter

const showAddEditModal = ref(false);
const editingTradeRun = ref(null);

onMounted(() => {
  tradeStore.fetchTradeRuns();
  tradeStore.fetchTradeStats();
  tradeStore.fetchLeaderboard(); // Fetch leaderboard data
});

const formatAUEC = (amount) => {
  if (amount === null || amount === undefined) return '0 aUEC';
  return new Intl.NumberFormat('en-US').format(amount) + ' aUEC';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const openEditModal = (run) => {
  editingTradeRun.value = { ...run };
  showAddEditModal.value = true;
};

const handleTradeRunSaved = () => {
  showAddEditModal.value = false;
  editingTradeRun.value = null;
  tradeStore.fetchTradeRuns();
  tradeStore.fetchTradeStats();
  tradeStore.fetchLeaderboard(); // Refresh leaderboard as well
};

const deleteRun = async (runId) => {
  if (confirm('Are you sure you want to delete this trade run?')) {
    try {
      await tradeStore.deleteTradeRun(runId);
      await tradeStore.fetchTradeStats();
      await tradeStore.fetchLeaderboard(); // Refresh leaderboard as well
    } catch (e) {
      // Error handled in store
    }
  }
};
</script>
