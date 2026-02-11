<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-bold text-white uppercase tracking-widest mb-4">{{ isEditMode ? 'Edit Cargo Contract' : 'Post Cargo Contract' }}</h3>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Origin</label>
            <input v-model="contractForm.origin" type="text" required
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
              placeholder="Pickup location">
          </div>
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Destination</label>
            <input v-model="contractForm.destination" type="text" required
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
              placeholder="Drop-off location">
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Commodity</label>
            <input v-model="contractForm.commodity" type="text" required
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
              placeholder="e.g., Agricium">
          </div>
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Quantity (SCU)</label>
            <input v-model.number="contractForm.quantity" type="number" required min="1"
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
          </div>
        </div>
        
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Payment (aUEC)</label>
          <input v-model.number="contractForm.payment_amount" type="number" required min="1"
            class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
        </div>
        
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Deadline (Optional)</label>
          <input v-model="contractForm.deadline" type="datetime-local"
            class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
        </div>
        
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Description (Optional)</label>
          <textarea v-model="contractForm.description" rows="2"
            class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
            placeholder="Any special requirements or details..."></textarea>
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
            {{ isLoading ? 'Saving...' : (isEditMode ? 'Update Contract' : 'Post Contract') }}
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
  contract: Object // Optional, for editing an existing contract
});

const emit = defineEmits(['close', 'contract-saved']);

const tradeStore = useTradeStore();
const isLoading = ref(false);
const error = ref(null);

const defaultForm = {
  origin: '',
  destination: '',
  commodity: '',
  quantity: null,
  payment_amount: null,
  deadline: '',
  description: ''
};

const contractForm = ref({ ...defaultForm });

const isEditMode = computed(() => !!props.contract);

watch(() => props.contract, (newVal) => {
  if (newVal) {
    contractForm.value = { ...newVal };
    if (contractForm.value.deadline) {
      contractForm.value.deadline = new Date(contractForm.value.deadline).toISOString().slice(0, 16);
    }
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
    const payload = { ...contractForm.value };
    if (payload.deadline) {
      payload.deadline = new Date(payload.deadline).toISOString();
    }

    if (isEditMode.value) {
      // Assuming a backend endpoint for updating contracts by ID exists for an actual edit mode
      // For now, this modal is primarily for creation or minor status updates handled by other buttons
      // The backend has PUT /api/trade/contracts/{contract_id}, but it expects CargoContractUpdate schema
      // which has status, hauler_id, completed_at. The current modal doesn't expose these directly for editing
      // For now, we'll only support creation via this modal
      // To properly support edit, the modal needs to be adjusted for the CargoContractUpdate schema
      // and a specific 'updateContract' action in the store/service.
      // For this task, we will consider the "Edit" for contracts to be mainly status changes handled by other buttons.
      // If a full edit of contract details is required, a more complex modal/view would be needed.
      error.value = 'Editing full contract details is not yet supported via this modal.';
      throw new Error(error.value);
    } else {
      result = await tradeStore.createContract(payload);
    }
    emit('contract-saved', result);
    emit('close');
    resetForm();
  } catch (err) {
    error.value = err.message || 'An unexpected error occurred.';
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  Object.assign(contractForm.value, defaultForm);
};
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
