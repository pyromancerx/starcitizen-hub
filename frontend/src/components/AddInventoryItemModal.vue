<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-sc-dark p-6 rounded-lg shadow-lg w-full max-w-md border border-sc-grey/20">
      <h3 class="text-xl font-bold text-white mb-4">Add New Inventory Item</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="itemName" class="block text-sc-grey text-sm font-bold mb-2">Item Name</label>
          <input type="text" id="itemName" v-model="newItem.item_name"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="itemType" class="block text-sc-grey text-sm font-bold mb-2">Item Type</label>
          <input type="text" id="itemType" v-model="newItem.item_type"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
        </div>
        <div>
          <label for="quantity" class="block text-sc-grey text-sm font-bold mb-2">Quantity</label>
          <input type="number" id="quantity" v-model.number="newItem.quantity"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" min="1" required />
        </div>
        <div>
          <label for="location" class="block text-sc-grey text-sm font-bold mb-2">Location</label>
          <input type="text" id="location" v-model="newItem.location"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
        </div>
        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            Add Item
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

const emit = defineEmits(['close', 'add-item']);

const newItem = ref({
  item_name: '',
  item_type: '',
  quantity: 1,
  location: ''
});

const handleSubmit = () => {
  emit('add-item', { ...newItem.value });
  // Reset form after submission
  newItem.value = {
    item_name: '',
    item_type: '',
    quantity: 1,
    location: ''
  };
};
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
