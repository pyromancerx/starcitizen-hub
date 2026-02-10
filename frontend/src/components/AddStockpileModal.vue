<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-sc-dark p-6 rounded-lg shadow-lg w-full max-w-md border border-sc-grey/20">
      <h3 class="text-xl font-bold text-white mb-4">Create New Stockpile</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="name" class="block text-sc-grey text-sm font-bold mb-2">Stockpile Name</label>
          <input type="text" id="name" v-model="newStockpile.name"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="resourceType" class="block text-sc-grey text-sm font-bold mb-2">Resource Type</label>
          <input type="text" id="resourceType" v-model="newStockpile.resource_type"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="description" class="block text-sc-grey text-sm font-bold mb-2">Description (Optional)</label>
          <textarea id="description" v-model="newStockpile.description" rows="3"
                    class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue"></textarea>
        </div>
        <div>
          <label for="initialQuantity" class="block text-sc-grey text-sm font-bold mb-2">Initial Quantity</label>
          <input type="number" id="initialQuantity" v-model.number="newStockpile.quantity"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" min="0" required />
        </div>
        <div>
          <label for="unit" class="block text-sc-grey text-sm font-bold mb-2">Unit (e.g., kg, units)</label>
          <input type="text" id="unit" v-model="newStockpile.unit"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
        </div>
        <div>
          <label for="minThreshold" class="block text-sc-grey text-sm font-bold mb-2">Minimum Threshold (Optional)</label>
          <input type="number" id="minThreshold" v-model.number="newStockpile.min_threshold"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" min="0" />
        </div>
        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            Create
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['close', 'add-stockpile']);

const newStockpile = ref({
  name: '',
  resource_type: '',
  description: '',
  quantity: 0,
  unit: '',
  min_threshold: null
});

const handleSubmit = () => {
  emit('add-stockpile', { ...newStockpile.value });
  // Reset form after submission
  newStockpile.value = {
    name: '',
    resource_type: '',
    description: '',
    quantity: 0,
    unit: '',
    min_threshold: null
  };
};
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
