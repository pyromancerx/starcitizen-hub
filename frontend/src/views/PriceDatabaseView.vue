<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Commodity Price Database</h2>
      <button @click="showAddModal = true" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
        Report Price
      </button>
    </div>

    <!-- Best Routes Section -->
    <div v-if="tradeStore.bestRoutes.length > 0" class="bg-sc-panel border border-sc-blue/20 rounded-lg p-6">
      <h3 class="text-lg font-bold text-sc-blue uppercase tracking-widest mb-4">Best Trade Routes</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="route in tradeStore.bestRoutes.slice(0, 6)" :key="route.commodity + route.origin" 
          class="bg-black/30 border border-sc-grey/20 rounded p-4">
          <div class="flex justify-between items-start mb-2">
            <span class="text-sc-blue font-bold">{{ route.commodity }}</span>
            <span class="text-green-400 text-sm font-bold">+{{ Math.round(route.profit_margin_percent) }}%</span>
          </div>
          <div class="text-sm text-sc-grey">{{ route.origin }} → {{ route.destination }}</div>
          <div class="text-xs text-sc-grey/50 mt-2">
            Buy: {{ formatAUEC(route.buy_price) }} | Sell: {{ formatAUEC(route.sell_price) }}
          </div>
          <div class="text-green-400 text-sm font-bold mt-1">Profit: {{ formatAUEC(route.profit_per_unit) }}/unit</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-4">
      <div class="flex-1">
        <input v-model="filters.location" type="text" placeholder="Filter by location..."
          class="w-full bg-sc-panel border border-sc-grey/30 rounded px-4 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
          @input="debouncedFetch">
      </div>
      <div class="flex-1">
        <input v-model="filters.commodity" type="text" placeholder="Filter by commodity..."
          class="w-full bg-sc-panel border border-sc-grey/30 rounded px-4 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
          @input="debouncedFetch">
      </div>
      <button @click="clearFilters" class="px-4 py-2 border border-sc-grey/30 text-sc-grey hover:text-white text-xs uppercase tracking-widest">
        Clear
      </button>
    </div>

    <div v-if="tradeStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else-if="tradeStore.priceReports.length === 0" class="bg-sc-panel border border-sc-grey/10 p-12 text-center">
      <p class="text-sc-grey uppercase tracking-widest">No price reports yet.</p>
      <p class="text-sc-grey/50 text-sm mt-2">Be the first to report commodity prices!</p>
    </div>

    <div v-else class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden">
      <table class="w-full">
        <thead class="bg-black/30">
          <tr>
            <th class="text-left p-4 text-xs text-sc-grey uppercase tracking-widest">Location</th>
            <th class="text-left p-4 text-xs text-sc-grey uppercase tracking-widest">Commodity</th>
            <th class="text-left p-4 text-xs text-sc-grey uppercase tracking-widest">Buy Price</th>
            <th class="text-left p-4 text-xs text-sc-grey uppercase tracking-widest">Sell Price</th>
            <th class="text-left p-4 text-xs text-sc-grey uppercase tracking-widest">Reported</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-sc-grey/10">
          <tr v-for="report in tradeStore.priceReports" :key="report.id" class="hover:bg-sc-blue/5 transition-colors">
            <td class="p-4 text-sm text-white">{{ report.location }}</td>
            <td class="p-4 text-sm text-sc-blue font-bold">{{ report.commodity }}</td>
            <td class="p-4 text-sm text-sc-grey">{{ report.buy_price ? formatAUEC(report.buy_price) : '-' }}</td>
            <td class="p-4 text-sm text-sc-grey">{{ report.sell_price ? formatAUEC(report.sell_price) : '-' }}</td>
            <td class="p-4 text-sm">
              <span :class="getFreshnessClass(report.reported_at)">
                {{ formatTimeAgo(report.reported_at) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Price Report Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="showAddModal = false">
      <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 w-full max-w-md shadow-2xl">
        <h3 class="text-xl font-bold text-white uppercase tracking-widest mb-4">Report Commodity Price</h3>
        
        <form @submit.prevent="submitPriceReport" class="space-y-4">
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Location</label>
            <input v-model="newReport.location" type="text" required
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
              placeholder="e.g., Port Olisar">
          </div>
          
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Commodity</label>
            <input v-model="newReport.commodity" type="text" required
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
              placeholder="e.g., Agricium">
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Buy Price (aUEC)</label>
              <input v-model.number="newReport.buy_price" type="number" min="0"
                class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
                placeholder="Optional">
            </div>
            <div>
              <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Sell Price (aUEC)</label>
              <input v-model.number="newReport.sell_price" type="number" min="0"
                class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
                placeholder="Optional">
            </div>
          </div>
          
          <div v-if="tradeStore.error" class="text-red-500 text-sm text-center">
            {{ tradeStore.error }}
          </div>
          
          <div class="flex gap-3 pt-4">
            <button type="button" @click="showAddModal = false"
              class="flex-1 py-2 border border-sc-grey/30 text-sc-grey hover:text-white hover:border-sc-grey transition-all text-xs uppercase tracking-widest">
              Cancel
            </button>
            <button type="submit" :disabled="tradeStore.isLoading || (!newReport.buy_price && !newReport.sell_price)"
              class="flex-1 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue hover:bg-sc-blue/20 transition-all text-xs uppercase tracking-widest disabled:opacity-50">
              {{ tradeStore.isLoading ? 'Saving...' : 'Report Price' }}
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
const filters = ref({
  location: '',
  commodity: ''
});

const newReport = ref({
  location: '',
  commodity: '',
  buy_price: null,
  sell_price: null
});

let debounceTimer;

onMounted(() => {
  tradeStore.fetchPriceReports();
  tradeStore.fetchBestRoutes();
});

const formatAUEC = (amount) => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US').format(amount) + ' aUEC';
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getFreshnessClass = (dateString) => {
  if (!dateString) return 'text-sc-grey';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = diffMs / 86400000;
  
  if (diffDays < 1) return 'text-green-400';
  if (diffDays < 3) return 'text-yellow-500';
  return 'text-red-400';
};

const debouncedFetch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    tradeStore.fetchPriceReports(filters.value);
  }, 300);
};

const clearFilters = () => {
  filters.value = { location: '', commodity: '' };
  tradeStore.fetchPriceReports();
};

const submitPriceReport = async () => {
  if (!newReport.value.buy_price && !newReport.value.sell_price) {
    return;
  }
  
  try {
    await tradeStore.createPriceReport(newReport.value);
    showAddModal.value = false;
    // Reset form
    newReport.value = {
      location: '',
      commodity: '',
      buy_price: null,
      sell_price: null
    };
    // Refresh routes after new price report
    await tradeStore.fetchBestRoutes();
  } catch (e) {
    // Error handled in store
  }
};
</script>
