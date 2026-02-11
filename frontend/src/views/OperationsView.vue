<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Operations Overview</h2>
      <router-link :to="{ name: 'operation-create' }" class="px-4 py-2 bg-sc-blue text-sc-dark text-xs font-bold uppercase tracking-widest hover:bg-white transition-all">Create Operation</router-link>
    </div>

    <div v-if="isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else class="space-y-4">
      <div v-for="operation in operations" :key="operation.id" class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6 flex flex-col md:flex-row justify-between items-center hover:border-sc-blue/30 transition-all group">
        <div class="flex items-center space-x-6 w-full">
          <!-- Date Badge -->
          <div class="flex-shrink-0 w-16 h-16 bg-sc-dark border border-sc-blue/20 rounded flex flex-col items-center justify-center">
            <div class="text-[10px] text-sc-blue font-bold uppercase">{{ formatDate(operation.scheduled_at, 'month') }}</div>
            <div class="text-2xl font-bold text-white">{{ formatDate(operation.scheduled_at, 'day') }}</div>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-1">
              <span class="px-2 py-0.5 rounded bg-sc-blue/10 text-[10px] text-sc-blue font-bold uppercase tracking-tighter">{{ operation.type }}</span>
              <span class="text-xs text-sc-grey/50">Scheduled for {{ formatDate(operation.scheduled_at, 'time') }}</span>
            </div>
            <h3 class="text-lg font-bold text-white uppercase tracking-tight truncate">{{ operation.title }}</h3>
            <p class="text-xs text-sc-grey/70 truncate">Status: {{ operation.status }}</p>
          </div>
        </div>

        <div class="mt-4 md:mt-0 md:ml-6 flex items-center space-x-4">
          <router-link :to="{ name: 'operation-detail', params: { id: operation.id } }" class="px-6 py-2 border border-sc-blue/50 text-sc-blue text-[10px] font-bold uppercase tracking-widest rounded hover:bg-sc-blue hover:text-sc-dark transition-all">Mission Intel</router-link>
        </div>
      </div>

      <div v-if="operations.length === 0" class="bg-sc-panel border border-sc-grey/10 p-12 text-center">
        <p class="text-sc-grey/50 uppercase tracking-widest">No operations currently scheduled.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import OperationsService from '../services/OperationsService';

const operations = ref([]);
const isLoading = ref(true);

const fetchOperations = async () => {
  isLoading.value = true;
  try {
    operations.value = await OperationsService.getOperations();
  } catch (error) {
    console.error('Failed to fetch operations:', error);
    // Optionally display an error message to the user
  } finally {
    isLoading.value = false;
  }
};

const formatDate = (dateString, part) => {
  const date = new Date(dateString);
  const options = {};
  if (part === 'month') {
    options.month = 'short';
  } else if (part === 'day') {
    options.day = 'numeric';
  } else if (part === 'time') {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return date.toLocaleDateString(undefined, options);
};

onMounted(fetchOperations);
</script>

<style scoped>
/* Add any specific styles for the view here if needed */
</style>
