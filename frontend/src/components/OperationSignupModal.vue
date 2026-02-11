<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-sc-dark p-6 rounded-lg shadow-lg w-full max-w-md border border-sc-grey/20">
      <h3 class="text-xl font-bold text-white mb-4">Sign Up for Operation</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="ship" class="block text-sc-grey text-sm font-bold mb-2">Select Your Ship (Optional)</label>
          <select id="ship" v-model="selectedShipId"
                  class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue">
            <option :value="null">No specific ship</option>
            <option v-for="ship in userShips" :key="ship.id" :value="ship.id">{{ ship.name }}</option>
          </select>
        </div>
        <div>
          <label for="role_preference" class="block text-sc-grey text-sm font-bold mb-2">Role Preference (Optional)</label>
          <input type="text" id="role_preference" v-model="rolePreference"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue"
                 placeholder="e.g., Pilot, Gunner, Medic" />
        </div>
        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            Sign Up
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';
import OperationsService from '../services/OperationsService';
import ShipService from '../services/ShipService';

const props = defineProps({
  show: Boolean,
  operationId: Number
});

const emit = defineEmits(['close', 'signed-up']);

const userShips = ref([]);
const selectedShipId = ref(null);
const rolePreference = ref('');

const fetchUserShips = async () => {
  try {
    userShips.value = await ShipService.getMyShips();
  } catch (error) {
    console.error('Failed to fetch user ships:', error);
    // Handle error, e.g., show a message to the user
  }
};

const handleSubmit = async () => {
  try {
    const signupData = {
      ship_id: selectedShipId.value,
      role_preference: rolePreference.value || null
    };
    await OperationsService.signupForOperation(props.operationId, signupData);
    alert('Successfully signed up for operation!');
    emit('signed-up');
    emit('close');
    resetForm();
  } catch (error) {
    console.error('Failed to sign up for operation:', error);
    alert('Failed to sign up for operation. You might already be signed up or the operation could not be found.');
  }
};

const resetForm = () => {
  selectedShipId.value = null;
  rolePreference.value = '';
};

watch(() => props.show, (newVal) => {
  if (newVal) {
    fetchUserShips();
    resetForm();
  }
});
</script>

<style scoped>
/* Specific styles for OperationSignupModal */
</style>
