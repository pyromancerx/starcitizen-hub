<template>
  <div class="space-y-6">
    <div v-if="isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else-if="tradeRun" class="bg-sc-panel border border-sc-grey/10 rounded-lg shadow-xl p-8">
      <!-- Header -->
      <div class="flex justify-between items-start mb-6">
        <div>
          <h2 class="text-3xl font-bold text-white tracking-wide uppercase italic mb-2">Trade Run #{{ tradeRun.id }}</h2>
          <div class="flex items-center space-x-3 text-sc-grey/70 text-sm">
            <span>{{ tradeRun.commodity }}</span>
            <span class="w-1 h-1 bg-sc-grey/50 rounded-full"></span>
            <span>Profit: <span :class="tradeRun.profit >= 0 ? 'text-green-400' : 'text-red-400'">{{ formatAUEC(tradeRun.profit) }}</span></span>
            <span class="w-1 h-1 bg-sc-grey/50 rounded-full"></span>
            <span>Completed: {{ formatDateTime(tradeRun.completed_at) }}</span>
          </div>
        </div>
        <div class="flex space-x-2">
          <router-link v-if="isOwner" :to="{ name: 'trade-run-edit', params: { id: tradeRun.id } }" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">Edit</router-link>
          <button v-if="isOwner" @click="handleDelete" class="px-4 py-2 bg-red-500/10 border border-red-500 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-sc-dark transition-all">Delete</button>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm mb-8">
        <div>
          <div class="text-sc-grey/50 uppercase text-xs font-bold mb-1">Origin</div>
          <p class="text-white">{{ tradeRun.origin_location }}</p>
        </div>
        <div>
          <div class="text-sc-grey/50 uppercase text-xs font-bold mb-1">Destination</div>
          <p class="text-white">{{ tradeRun.destination_location }}</p>
        </div>
        <div>
          <div class="text-sc-grey/50 uppercase text-xs font-bold mb-1">Commodity</div>
          <p class="text-white">{{ tradeRun.commodity }}</p>
        </div>
        <div>
          <div class="text-sc-grey/50 uppercase text-xs font-bold mb-1">Quantity (SCU)</div>
          <p class="text-white">{{ tradeRun.quantity }}</p>
        </div>
        <div>
          <div class="text-sc-grey/50 uppercase text-xs font-bold mb-1">Buy Price (total)</div>
          <p class="text-white">{{ formatAUEC(tradeRun.buy_price) }}</p>
        </div>
        <div>
          <div class="text-sc-grey/50 uppercase text-xs font-bold mb-1">Sell Price (total)</div>
          <p class="text-white">{{ formatAUEC(tradeRun.sell_price) }}</p>
        </div>
        <div v-if="tradeRun.ship_id">
          <div class="text-sc-grey/50 uppercase text-xs font-bold mb-1">Ship Used</div>
          <p class="text-white">{{ tradeRun.ship?.name || 'Unknown' }}</p>
        </div>
      </div>

      <!-- Notes -->
      <div v-if="tradeRun.notes" class="mb-8">
        <div class="text-sc-grey/50 uppercase text-xs font-bold mb-2">Notes</div>
        <p class="text-white leading-relaxed">{{ tradeRun.notes }}</p>
      </div>
    </div>

    <div v-else class="text-center p-12 text-sc-grey/70">
      <p class="text-xl">Trade run not found.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTradeStore } from '../stores/trade';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const tradeStore = useTradeStore();
const authStore = useAuthStore();

const tradeRun = ref(null);
const isLoading = ref(true);

const tradeRunId = computed(() => parseInt(route.params.id));
const currentUserId = computed(() => authStore.user?.id);
const isOwner = computed(() => tradeRun.value?.user_id === currentUserId.value);

const fetchTradeRun = async () => {
  isLoading.value = true;
  try {
    tradeRun.value = await tradeStore.getTradeRun(tradeRunId.value);
  } catch (error) {
    console.error('Failed to fetch trade run:', error);
    tradeRun.value = null; // Indicate not found or error
  } finally {
    isLoading.value = false;
  }
};

const handleDelete = async () => {
  if (confirm('Are you sure you want to delete this trade run? This action cannot be undone.')) {
    try {
      await tradeStore.deleteTradeRun(tradeRunId.value);
      alert('Trade run deleted successfully!');
      router.push({ name: 'trade-runs' }); // Redirect to trade runs list
    } catch (error) {
      console.error('Failed to delete trade run:', error);
      alert('Failed to delete trade run.');
    }
  }
};

const formatAUEC = (amount) => {
  if (amount === null || amount === undefined) return '0 aUEC';
  return new Intl.NumberFormat('en-US').format(amount) + ' aUEC';
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

onMounted(fetchTradeRun);
</script>

<style scoped>
/* Specific styles for TradeRunDetailView */
</style>
