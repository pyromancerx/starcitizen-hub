<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-sc-dark p-6 rounded-lg shadow-lg w-full max-w-md border border-sc-grey/20">
      <h3 class="text-xl font-bold text-white mb-4">Launch New Project</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="title" class="block text-sc-grey text-sm font-bold mb-2">Project Title</label>
          <input type="text" id="title" v-model="newProject.title"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="description" class="block text-sc-grey text-sm font-bold mb-2">Description (Optional)</label>
          <textarea id="description" v-model="newProject.description" rows="3"
                    class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue"></textarea>
        </div>
        <div>
          <label for="targetDate" class="block text-sc-grey text-sm font-bold mb-2">Target Completion Date (Optional)</label>
          <input type="date" id="targetDate" v-model="newProject.target_date"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
        </div>
        <div>
          <label for="status" class="block text-sc-grey text-sm font-bold mb-2">Status</label>
          <select id="status" v-model="newProject.status"
                  class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            Launch Project
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

const emit = defineEmits(['close', 'add-project']);

const newProject = ref({
  title: '',
  description: '',
  target_date: '',
  status: 'Planning'
});

const handleSubmit = () => {
  const projectData = { ...newProject.value };
  // Convert date to ISO string if it exists
  if (projectData.target_date) {
    projectData.target_date = new Date(projectData.target_date).toISOString().split('T')[0];
  }
  emit('add-project', projectData);
  // Reset form after submission
  newProject.value = {
    title: '',
    description: '',
    target_date: '',
    status: 'Planning'
  };
};
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
