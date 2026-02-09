<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Trade Run Tracker</h2>
      <button @click="showAddModal = true" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
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

    <div v-if="tradeStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else-if="tradeStore.tradeRuns.length === 0" class="bg-sc-panel border border-sc-grey/10 p-12 text-center">
      <p class="text-sc-grey uppercase tracking-widest">No trade runs logged yet.</p>
      <p class="text-sc-grey/50 text-sm mt-2">Start logging your trade runs to track your profits!</p>
    </div>

    <div v-else class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden">
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
              <button @click="deleteRun(run.id)" class="text-red-500 hover:text-red-400 text-xs uppercase tracking-widest">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Trade Run Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="showAddModal = false">
      <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 w-full max-w-md shadow-2xl">
        <h3 class="text-xl font-bold text-white uppercase tracking-widest mb-4">Log Trade Run</h3>
        
        <form @submit.prevent="submitTradeRun" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Origin</label>
              <input v-model="newRun.origin_location" type="text" required
                class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
                placeholder="Port Olisar">
            </div>
            <div>
              <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Destination</label>
              <input v-model="newRun.destination_location" type="text" required
                class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
                placeholder="Grim HEX">
            </div>
          </div>
          
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Commodity</label>
            <input v-model="newRun.commodity" type="text" required
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
              placeholder="Agricium">
          </div>
          
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Quantity (SCU)</label>
              <input v-model.number="newRun.quantity" type="number" required min="1"
                class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
            </div>
            <div>
              <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Buy Price</label>
              <input v-model.number="newRun.buy_price" type="number" required min="0"
                class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
                placeholder="aUEC">
            </div>
            <div>
              <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Sell Price</label>
              <input v-model.number="newRun.sell_price" type="number" required min="0"
                class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
                placeholder="aUEC">
            </div>
          </div>
          
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Notes (Optional)</label>
            <textarea v-model="newRun.notes" rows="2"
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
              placeholder="Any additional details..."></textarea>
          </div>
          
          <div v-if="tradeStore.error" class="text-red-500 text-sm text-center">
            {{ tradeStore.error }}
          </div>
          
          <div class="flex gap-3 pt-4">
            <button type="button" @click="showAddModal = false"
              class="flex-1 py-2 border border-sc-grey/30 text-sc-grey hover:text-white hover:border-sc-grey transition-all text-xs uppercase tracking-widest">
              Cancel
            </button>
            <button type="submit" :disabled="tradeStore.isLoading"
              class="flex-1 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue hover:bg-sc-blue/20 transition-all text-xs uppercase tracking-widest disabled:opacity-50">
              {{ tradeStore.isLoading ? 'Saving...' : 'Log Run' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTradeStore } from '../stores/trade';

const tradeStore = useTradeStore();
const showAddModal = ref(false);

const newRun = ref({
  origin_location: '',
  destination_location: '',
  commodity: '',
  quantity: null,
  buy_price: null,
  sell_price: null,
  notes: ''
});

onMounted(() => {
  tradeStore.fetchTradeRuns();
  tradeStore.fetchTradeStats();
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

const submitTradeRun = async () => {
  try {
    await tradeStore.createTradeRun(newRun.value);
    showAddModal.value = false;
    // Reset form
    newRun.value = {
      origin_location: '',
      destination_location: '',
      commodity: '',
      quantity: null,
      buy_price: null,
      sell_price: null,
      notes: ''
    };
    await tradeStore.fetchTradeStats();
  } catch (e) {
    // Error handled in store
  }
};

const deleteRun = async (runId) => {
  if (confirm('Are you sure you want to delete this trade run?')) {
    try {
      await tradeStore.deleteTradeRun(runId);
      await tradeStore.fetchTradeStats();
    } catch (e) {
      // Error handled in store
    }
  }
};
</script>
