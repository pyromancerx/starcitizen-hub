<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 w-full max-w-md shadow-2xl">
      <h3 class="text-xl font-bold text-white uppercase tracking-widest mb-4">{{ isEditMode ? 'Edit Trade Run' : 'Log Trade Run' }}</h3>
      
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
          <button type="button" @click="$emit('close')"
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
import { ref, defineProps, defineEmits, watch, computed } from 'vue';
import { useTradeStore } from '../stores/trade';

const props = defineProps({
  show: Boolean,
  tradeRun: Object // Optional, for editing an existing trade run
});

const emit = defineEmits(['close', 'trade-run-saved']);

const tradeStore = useTradeStore();
const isLoading = ref(false);
const error = ref(null);

const defaultForm = {
  origin_location: '',
  destination_location: '',
  commodity: '',
  quantity: null,
  buy_price: null,
  sell_price: null,
  ship_id: null, // Assuming ship selection might be added later
  notes: ''
};

const tradeRunForm = ref({ ...defaultForm });

const isEditMode = computed(() => !!props.tradeRun);

watch(() => props.tradeRun, (newVal) => {
  if (newVal) {
    tradeRunForm.value = { ...newVal };
  } else {
    resetForm();
  }
}, { immediate: true });

watch(() => props.show, (newVal) => {
  if (newVal && !isEditMode.value) {
    resetForm();
  }
});

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    let result;
    if (isEditMode.value) {
      result = await tradeStore.updateTradeRun(props.tradeRun.id, tradeRunForm.value);
    } else {
      result = await tradeStore.createTradeRun(tradeRunForm.value);
    }
    emit('trade-run-saved', result);
    emit('close');
    resetForm();
  } catch (err) {
    error.value = err.message || 'An unexpected error occurred.';
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  Object.assign(tradeRunForm.value, defaultForm);
};
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
