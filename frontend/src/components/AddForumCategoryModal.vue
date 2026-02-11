<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-sc-dark p-6 rounded-lg shadow-lg w-full max-w-md border border-sc-grey/20">
      <h3 class="text-xl font-bold text-white mb-4">Create New Forum Category</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="categoryName" class="block text-sc-grey text-sm font-bold mb-2">Category Name</label>
          <input type="text" id="categoryName" v-model="newCategory.name"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="categoryDescription" class="block text-sc-grey text-sm font-bold mb-2">Description (Optional)</label>
          <textarea id="categoryDescription" v-model="newCategory.description" rows="3"
                    class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue"></textarea>
        </div>
        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            Create Category
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

const emit = defineEmits(['close', 'add-category']);

const newCategory = ref({
  name: '',
  description: ''
});

const handleSubmit = () => {
  emit('add-category', { ...newCategory.value });
  // Reset form after submission
  newCategory.value = {
    name: '',
    description: ''
  };
};
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
