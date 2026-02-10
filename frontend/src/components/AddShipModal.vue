<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-sc-dark p-6 rounded-lg shadow-lg w-full max-w-md border border-sc-grey/20">
      <h3 class="text-xl font-bold text-white mb-4">Register New Vessel</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="shipName" class="block text-sc-grey text-sm font-bold mb-2">Ship Name</label>
          <input type="text" id="shipName" v-model="newShip.name"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
        </div>
        <div>
          <label for="shipType" class="block text-sc-grey text-sm font-bold mb-2">Ship Type</label>
          <input type="text" id="shipType" v-model="newShip.ship_type"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
        </div>
        <div>
          <label for="serialNumber" class="block text-sc-grey text-sm font-bold mb-2">Serial Number</label>
          <input type="text" id="serialNumber" v-model="newShip.serial_number"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
        </div>
        <div>
          <label for="insuranceStatus" class="block text-sc-grey text-sm font-bold mb-2">Insurance Status</label>
          <select id="insuranceStatus" v-model="newShip.insurance_status"
                  class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue">
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            Register
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

const emit = defineEmits(['close', 'add-ship']);

const newShip = ref({
  name: '',
  ship_type: '',
  serial_number: '',
  insurance_status: 'active'
});

const handleSubmit = () => {
  emit('add-ship', { ...newShip.value });
  // Reset form after submission
  newShip.value = {
    name: '',
    ship_type: '',
    serial_number: '',
    insurance_status: 'active'
  };
};
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
