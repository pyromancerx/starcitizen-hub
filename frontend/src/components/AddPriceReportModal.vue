<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 w-full max-w-md shadow-2xl">
      <h3 class="text-xl font-bold text-white uppercase tracking-widest mb-4">Report Commodity Price</h3>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Location</label>
          <input v-model="priceReportForm.location" type="text" required
            class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
            placeholder="e.g., Port Olisar">
        </div>
        
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Commodity</label>
          <input v-model="priceReportForm.commodity" type="text" required
            class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
            placeholder="e.g., Agricium">
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Buy Price (aUEC)</label>
            <input v-model.number="priceReportForm.buy_price" type="number" min="0"
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
              placeholder="Optional">
          </div>
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Sell Price (aUEC)</label>
            <input v-model.number="priceReportForm.sell_price" type="number" min="0"
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
              placeholder="Optional">
          </div>
        </div>
        
        <div v-if="error" class="text-red-500 text-sm text-center">
          {{ error }}
        </div>
        
        <div class="flex gap-3 pt-4">
          <button type="button" @click="$emit('close')"
            class="flex-1 py-2 border border-sc-grey/30 text-sc-grey hover:text-white hover:border-sc-grey transition-all text-xs uppercase tracking-widest">
            Cancel
          </button>
          <button type="submit" :disabled="isLoading || (!priceReportForm.buy_price && !priceReportForm.sell_price)"
            class="flex-1 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue hover:bg-sc-blue/20 transition-all text-xs uppercase tracking-widest disabled:opacity-50">
            {{ isLoading ? 'Saving...' : 'Report Price' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import { useTradeStore } from '../stores/trade';

const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(['close', 'price-report-saved']);

const tradeStore = useTradeStore();
const isLoading = ref(false);
const error = ref(null);

const defaultForm = {
  location: '',
  commodity: '',
  buy_price: null,
  sell_price: null
};

const priceReportForm = ref({ ...defaultForm });

const handleSubmit = async () => {
  if (!priceReportForm.value.buy_price && !priceReportForm.value.sell_price) {
    error.value = 'Please enter at least a Buy Price or a Sell Price.';
    return;
  }

  isLoading.value = true;
  error.value = null;
  try {
    const result = await tradeStore.createPriceReport(priceReportForm.value);
    emit('price-report-saved', result);
    emit('close');
    resetForm();
  } catch (err) {
    error.value = err.message || 'An unexpected error occurred.';
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  Object.assign(priceReportForm.value, defaultForm);
};
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
