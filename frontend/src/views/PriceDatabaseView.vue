<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Commodity Price Database</h2>
      <button @click="showAddPriceReportModal = true" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
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

    <!-- Latest Prices by Location -->
    <div class="bg-sc-panel border border-sc-grey/10 rounded-lg shadow-xl p-8">
      <h3 class="text-lg font-bold text-white mb-4">Latest Prices by Location</h3>
      <div class="flex space-x-2 mb-4">
        <input type="text" v-model="latestPriceLocationInput" placeholder="Enter location (e.g., Port Olisar)"
               class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none" />
        <button @click="fetchLatestPricesByLocation" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
          Search
        </button>
      </div>
      <div v-if="latestPricesLoading" class="flex justify-center p-4">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sc-blue"></div>
      </div>
      <div v-else-if="latestPricesByLocation.length > 0">
        <table class="w-full text-left border-collapse bg-black/20 rounded-lg overflow-hidden">
          <thead>
            <tr class="text-[10px] text-sc-grey/50 uppercase tracking-widest font-bold">
              <th class="p-4 border-b border-sc-grey/10">Commodity</th>
              <th class="p-4 border-b border-sc-grey/10">Buy Price</th>
              <th class="p-4 border-b border-sc-grey/10">Sell Price</th>
              <th class="p-4 border-b border-sc-grey/10">Reported</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="price in latestPricesByLocation" :key="price.commodity" class="hover:bg-white/5 border-b border-sc-grey/5 transition-colors">
              <td class="p-4 text-sm text-sc-blue font-bold">{{ price.commodity }}</td>
              <td class="p-4 text-sm text-white">{{ price.buy_price ? formatAUEC(price.buy_price) : '-' }}</td>
              <td class="p-4 text-sm text-white">{{ price.sell_price ? formatAUEC(price.sell_price) : '-' }}</td>
              <td class="p-4 text-sm">
                <span :class="getFreshnessClass(price.reported_at)">
                  {{ formatTimeAgo(price.reported_at) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="text-sc-grey/50 p-4">No prices found for this location.</p>
    </div>

    <!-- Historical Price Data -->
    <div class="bg-sc-panel border border-sc-grey/10 rounded-lg shadow-xl p-8 mt-8">
      <h3 class="text-lg font-bold text-white mb-4">Historical Price Data</h3>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <input type="text" v-model="historyLocationInput" placeholder="Enter location (e.g., Port Olisar)"
               class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none" />
        <input type="text" v-model="historyCommodityInput" placeholder="Enter commodity (e.g., Agricium)"
               class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none" />
      </div>
      <div class="flex justify-end mb-4">
        <button @click="fetchPriceHistory" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
          View History
        </button>
      </div>
      <div v-if="historyLoading" class="flex justify-center p-4">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sc-blue"></div>
      </div>
      <div v-else-if="historicalPrices.length > 0">
        <table class="w-full text-left border-collapse bg-black/20 rounded-lg overflow-hidden">
          <thead>
            <tr class="text-[10px] text-sc-grey/50 uppercase tracking-widest font-bold">
              <th class="p-4 border-b border-sc-grey/10">Reported Date</th>
              <th class="p-4 border-b border-sc-grey/10">Buy Price</th>
              <th class="p-4 border-b border-sc-grey/10">Sell Price</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="price in historicalPrices" :key="price.reported_at" class="hover:bg-white/5 border-b border-sc-grey/5 transition-colors">
              <td class="p-4 text-sm text-white">{{ formatDateTime(price.reported_at) }}</td>
              <td class="p-4 text-sm text-white">{{ price.buy_price ? formatAUEC(price.buy_price) : '-' }}</td>
              <td class="p-4 text-sm text-white">{{ price.sell_price ? formatAUEC(price.sell_price) : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="text-sc-grey/50 p-4">No historical data available for this commodity/location.</p>
    </div>


    <!-- Filters for All Price Reports -->
    <h3 class="text-xl font-bold text-white mb-4 mt-8">All Price Reports</h3>
    <div class="flex gap-4 mb-4">
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

    <AddPriceReportModal
      :show="showAddPriceReportModal"
      @close="showAddPriceReportModal = false"
      @price-report-saved="handlePriceReportSaved"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTradeStore } from '../stores/trade';
import AddPriceReportModal from '../components/AddPriceReportModal.vue'; // Import the new modal component

const tradeStore = useTradeStore();

const showAddPriceReportModal = ref(false); // Renamed from showAddModal
const filters = ref({
  location: '',
  commodity: ''
});

const latestPriceLocationInput = ref('');
const latestPricesByLocation = ref([]);
const latestPricesLoading = ref(false);

const historyLocationInput = ref('');
const historyCommodityInput = ref('');
const historicalPrices = ref([]);
const historyLoading = ref(false);

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

const handlePriceReportSaved = () => {
  showAddPriceReportModal.value = false;
  tradeStore.fetchPriceReports(filters.value); // Refresh the main list
  tradeStore.fetchBestRoutes(); // Refresh best routes after new price report
  // If user is currently viewing latest prices for a location, refresh that too
  if (latestPriceLocationInput.value) {
    fetchLatestPricesByLocation();
  }
};

const fetchLatestPricesByLocation = async () => {
  if (!latestPriceLocationInput.value) {
    latestPricesByLocation.value = [];
    return;
  }
  latestPricesLoading.value = true;
  try {
    latestPricesByLocation.value = await tradeStore.getPricesByLocation(latestPriceLocationInput.value);
  } catch (error) {
    console.error('Failed to fetch latest prices by location:', error);
    latestPricesByLocation.value = [];
    alert('Failed to fetch prices for this location.');
  } finally {
    latestPricesLoading.value = false;
  }
};

const fetchPriceHistory = async () => {
  if (!historyLocationInput.value || !historyCommodityInput.value) {
    historicalPrices.value = [];
    alert('Please enter both location and commodity for historical data.');
    return;
  }
  historyLoading.value = true;
  try {
    historicalPrices.value = await tradeStore.getPriceHistory(historyLocationInput.value, historyCommodityInput.value);
  } catch (error) {
    console.error('Failed to fetch price history:', error);
    historicalPrices.value = [];
    alert('Failed to fetch historical prices.');
  } finally {
    historyLoading.value = false;
  }
};
</script>
