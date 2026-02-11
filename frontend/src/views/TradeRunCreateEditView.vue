<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">{{ isEditMode ? 'Edit Trade Run' : 'Log New Trade Run' }}</h2>

    <div class="bg-sc-panel border border-sc-grey/10 rounded-lg shadow-xl p-8">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Origin</label>
            <input v-model="tradeRunForm.origin_location" type="text" required
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
              placeholder="Port Olisar">
          </div>
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Destination</label>
            <input v-model="tradeRunForm.destination_location" type="text" required
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
              placeholder="Grim HEX">
          </div>
        </div>
        
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Commodity</label>
          <input v-model="tradeRunForm.commodity" type="text" required
            class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
            placeholder="Agricium">
        </div>
        
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Quantity (SCU)</label>
            <input v-model.number="tradeRunForm.quantity" type="number" required min="1"
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
          </div>
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Buy Price</label>
            <input v-model.number="tradeRunForm.buy_price" type="number" required min="0"
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
              placeholder="aUEC">
          </div>
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Sell Price</label>
            <input v-model.number="tradeRunForm.sell_price" type="number" required min="0"
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
              placeholder="aUEC">
          </div>
        </div>
        
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Notes (Optional)</label>
          <textarea v-model="tradeRunForm.notes" rows="2"
            class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
            placeholder="Any additional details..."></textarea>
        </div>
        
        <div v-if="error" class="text-red-500 text-sm text-center">
          {{ error }}
        </div>
        
        <div class="flex gap-3 pt-4">
          <button type="button" @click="router.push({ name: 'trade-runs' })"
            class="flex-1 py-2 border border-sc-grey/30 text-sc-grey hover:text-white hover:border-sc-grey transition-all text-xs uppercase tracking-widest">
            Cancel
          </button>
          <button type="submit" :disabled="isLoading"
            class="flex-1 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue hover:bg-sc-blue/20 transition-all text-xs uppercase tracking-widest disabled:opacity-50">
            {{ isLoading ? 'Saving...' : (isEditMode ? 'Update Run' : 'Log Run') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTradeStore } from '../stores/trade';

const route = useRoute();
const router = useRouter();
const tradeStore = useTradeStore();

const tradeRunForm = ref({
  origin_location: '',
  destination_location: '',
  commodity: '',
  quantity: null,
  buy_price: null,
  sell_price: null,
  ship_id: null,
  notes: ''
});

const isLoading = ref(false);
const error = ref(null);

const isEditMode = computed(() => !!route.params.id);

onMounted(async () => {
  if (isEditMode.value) {
    isLoading.value = true;
    try {
      const runId = parseInt(route.params.id);
      const fetchedRun = await tradeStore.getTradeRun(runId);
      if (fetchedRun) {
        tradeRunForm.value = { ...fetchedRun };
      } else {
        alert('Trade run not found.');
        router.push({ name: 'trade-runs' });
      }
    } catch (e) {
      console.error('Failed to fetch trade run for editing:', e);
      error.value = 'Failed to load trade run data.';
      router.push({ name: 'trade-runs' });
    } finally {
      isLoading.value = false;
    }
  }
});

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    let result;
    if (isEditMode.value) {
      result = await tradeStore.updateTradeRun(parseInt(route.params.id), tradeRunForm.value);
    } else {
      result = await tradeStore.createTradeRun(tradeRunForm.value);
    }
    router.push({ name: 'trade-run-detail', params: { id: result.id } });
    alert('Trade run saved successfully!');
  } catch (e) {
    console.error('Failed to save trade run:', e);
    error.value = e.message || 'An unexpected error occurred.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Specific styles for TradeRunCreateEditView */
</style>
