<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">{{ isEditMode ? 'Edit Operation' : 'Create New Operation' }}</h2>

    <div class="bg-sc-panel border border-sc-grey/10 rounded-lg shadow-xl p-8">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Title -->
        <div>
          <label for="title" class="block text-sc-grey text-sm font-bold mb-2">Operation Title <span class="text-red-500">*</span></label>
          <input type="text" id="title" v-model="operationForm.title"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>

        <!-- Type -->
        <div>
          <label for="type" class="block text-sc-grey text-sm font-bold mb-2">Operation Type <span class="text-red-500">*</span></label>
          <select id="type" v-model="operationForm.type"
                  class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required>
            <option disabled value="">Please select one</option>
            <option v-for="opType in operationTypes" :key="opType" :value="opType">{{ opType }}</option>
          </select>
        </div>

        <!-- Scheduled At -->
        <div>
          <label for="scheduled_at" class="block text-sc-grey text-sm font-bold mb-2">Scheduled At <span class="text-red-500">*</span></label>
          <input type="datetime-local" id="scheduled_at" v-model="operationForm.scheduled_at"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sc-grey text-sm font-bold mb-2">Description</label>
          <textarea id="description" v-model="operationForm.description" rows="4"
                    class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue"></textarea>
        </div>

        <!-- Estimated Duration -->
        <div>
          <label for="estimated_duration" class="block text-sc-grey text-sm font-bold mb-2">Estimated Duration (hours)</label>
          <input type="number" id="estimated_duration" v-model.number="operationForm.estimated_duration"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" min="0" />
        </div>

        <!-- Max Participants -->
        <div>
          <label for="max_participants" class="block text-sc-grey text-sm font-bold mb-2">Max Participants</label>
          <input type="number" id="max_participants" v-model.number="operationForm.max_participants"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" min="1" />
        </div>

        <!-- Requirements -->
        <div>
          <label for="requirements" class="block text-sc-grey text-sm font-bold mb-2">Requirements</label>
          <textarea id="requirements" v-model="operationForm.requirements" rows="2"
                    class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue"></textarea>
        </div>

        <!-- Required Roles (comma-separated) -->
        <div>
          <label for="required_roles" class="block text-sc-grey text-sm font-bold mb-2">Required Roles (comma-separated)</label>
          <input type="text" id="required_roles" v-model="operationForm.required_roles"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue"
                 placeholder="e.g., Pilot, Gunner, Medic" />
        </div>

        <!-- Required Ship Types (comma-separated) -->
        <div>
          <label for="required_ship_types" class="block text-sc-grey text-sm font-bold mb-2">Required Ship Types (comma-separated)</label>
          <input type="text" id="required_ship_types" v-model="operationForm.required_ship_types"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue"
                 placeholder="e.g., Fighter, Bomber, Transport" />
        </div>

        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="router.push({ name: 'operations' })"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            {{ isEditMode ? 'Update Operation' : 'Create Operation' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import OperationsService from '../services/OperationsService';

const route = useRoute();
const router = useRouter();

const operationForm = ref({
  title: '',
  description: '',
  type: '',
  scheduled_at: '',
  estimated_duration: null,
  max_participants: null,
  requirements: '',
  required_roles: '', // Comma-separated string
  required_ship_types: '' // Comma-separated string
});

const operationTypes = ['MISSION', 'TRAINING', 'EXPLORATION', 'TRADE', 'PIRACY', 'OTHER']; // Matches backend OperationType enum

const isEditMode = computed(() => !!route.params.id);

onMounted(async () => {
  if (isEditMode.value) {
    try {
      const operationId = parseInt(route.params.id);
      const fetchedOperation = await OperationsService.getOperation(operationId);
      if (fetchedOperation) {
        // Populate form, convert arrays to comma-separated strings
        operationForm.value = {
          ...fetchedOperation,
          scheduled_at: fetchedOperation.scheduled_at ? new Date(fetchedOperation.scheduled_at).toISOString().slice(0, 16) : '',
          required_roles: fetchedOperation.required_roles ? fetchedOperation.required_roles.join(', ') : '',
          required_ship_types: fetchedOperation.required_ship_types ? fetchedOperation.required_ship_types.join(', ') : '',
        };
      } else {
        alert('Operation not found.');
        router.push({ name: 'operations' });
      }
    } catch (error) {
      console.error('Failed to fetch operation for editing:', error);
      alert('Failed to load operation data.');
      router.push({ name: 'operations' });
    }
  }
});

const handleSubmit = async () => {
  try {
    const payload = {
      ...operationForm.value,
      // Convert dates to ISO string
      scheduled_at: operationForm.value.scheduled_at ? new Date(operationForm.value.scheduled_at).toISOString() : null,
      // Convert comma-separated strings to arrays
      required_roles: operationForm.value.required_roles.split(',').map(s => s.trim()).filter(Boolean),
      required_ship_types: operationForm.value.required_ship_types.split(',').map(s => s.trim()).filter(Boolean),
    };

    let result;
    if (isEditMode.value) {
      result = await OperationsService.updateOperation(parseInt(route.params.id), payload);
      alert('Operation updated successfully!');
    } else {
      result = await OperationsService.createOperation(payload);
      alert('Operation created successfully!');
    }
    router.push({ name: 'operation-detail', params: { id: result.id } });
  } catch (error) {
    console.error('Failed to save operation:', error);
    alert('Failed to save operation. Please check your input and try again.');
  }
};
</script>

<style scoped>
/* Specific styles for OperationCreateEditView */
</style>
