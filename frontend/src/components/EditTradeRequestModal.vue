<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-sc-dark p-6 rounded-lg shadow-lg w-full max-w-md border border-sc-grey/20">
      <h3 class="text-xl font-bold text-white mb-4">Edit Trade Request</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="resourceType" class="block text-sc-grey text-sm font-bold mb-2">Resource Type</label>
          <input type="text" id="resourceType" v-model="requestData.resource_type"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="amount" class="block text-sc-grey text-sm font-bold mb-2">Amount</label>
          <input type="number" id="amount" v-model.number="requestData.amount"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="unit" class="block text-sc-grey text-sm font-bold mb-2">Unit</label>
          <input type="text" id="unit" v-model="requestData.unit"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="pricePerUnit" class="block text-sc-grey text-sm font-bold mb-2">Price Per Unit (Optional)</label>
          <input type="number" id="pricePerUnit" v-model.number="requestData.price_per_unit"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
        </div>
        <div>
          <label for="status" class="block text-sc-grey text-sm font-bold mb-2">Status</label>
          <select id="status" v-model="requestData.status"
                  class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required>
            <option value="open">Open</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div>
          <label for="expiresAt" class="block text-sc-grey text-sm font-bold mb-2">Expires At (Optional)</label>
          <input type="datetime-local" id="expiresAt" v-model="requestData.expires_at"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
        </div>
        
        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            Update Request
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';
import { useFederationStore } from '../stores/federation';

const props = defineProps({
  show: Boolean,
  request: Object, // The trade request object to edit
});

const emit = defineEmits(['close', 'request-updated']);

const fedStore = useFederationStore();

const requestData = ref({
  resource_type: '',
  amount: null,
  unit: 'units',
  price_per_unit: null,
  status: 'open',
  expires_at: '',
});

// Watch for changes in the request prop to populate the form
watch(() => props.request, (newVal) => {
  if (newVal) {
    requestData.value.resource_type = newVal.resource_type;
    requestData.value.amount = newVal.amount;
    requestData.value.unit = newVal.unit;
    requestData.value.price_per_unit = newVal.price_per_unit;
    requestData.value.status = newVal.status;
    // Convert ISO string to datetime-local format
    requestData.value.expires_at = newVal.expires_at ? new Date(newVal.expires_at).toISOString().slice(0, 16) : '';
  }
}, { immediate: true });

const handleSubmit = async () => {
  try {
    const isoExpiresAt = requestData.value.expires_at ? new Date(requestData.value.expires_at).toISOString() : null;
    await fedStore.updateTradeRequest(props.request.id, {
      ...requestData.value,
      expires_at: isoExpiresAt,
    });
    emit('request-updated');
    emit('close');
  } catch (error) {
    alert(error.message || 'Failed to update trade request.');
  }
};
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
