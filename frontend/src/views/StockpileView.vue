<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Org Stockpiles</h2>
      <button class="px-4 py-2 bg-sc-blue text-sc-dark text-xs font-bold uppercase tracking-widest hover:bg-white transition-all">New Stockpile</button>
    </div>

    <div v-if="stockpileStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div v-for="stockpile in stockpileStore.stockpiles" :key="stockpile.id" class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6 hover:border-sc-blue/30 transition-all shadow-lg">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h3 class="text-lg font-bold text-white uppercase">{{ stockpile.name }}</h3>
            <span class="text-[10px] text-sc-blue font-bold uppercase tracking-widest">{{ stockpile.resource_type }}</span>
          </div>
          <div v-if="stockpile.min_threshold && stockpile.quantity < stockpile.min_threshold" class="px-2 py-1 bg-red-500/20 text-red-500 text-[10px] font-bold uppercase rounded border border-red-500/30 animate-pulse">
            Low Stock
          </div>
        </div>
        
        <p class="text-xs text-sc-grey/70 mb-6 line-clamp-2 h-8">{{ stockpile.description || 'No description provided.' }}</p>
        
        <div class="space-y-2">
          <div class="flex justify-between text-xs font-bold">
            <span class="text-sc-grey/50 uppercase">Current Quantity</span>
            <span class="text-white font-mono">{{ stockpile.quantity.toLocaleString() }} {{ stockpile.unit }}</span>
          </div>
          <div class="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
            <div 
              class="bg-sc-blue h-full transition-all duration-1000" 
              :style="{ width: Math.min((stockpile.quantity / (stockpile.min_threshold * 2 || 100)) * 100, 100) + '%' }"
            ></div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-sc-grey/5 flex space-x-2">
          <button class="flex-1 py-2 bg-white/5 hover:bg-sc-blue/10 text-[10px] text-sc-grey hover:text-sc-blue font-bold uppercase tracking-widest rounded transition-all">Adjust</button>
          <button class="flex-1 py-2 bg-white/5 hover:bg-sc-blue/10 text-[10px] text-sc-grey hover:text-sc-blue font-bold uppercase tracking-widest rounded transition-all">History</button>
        </div>
      </div>
      
      <div v-if="stockpileStore.stockpiles.length === 0" class="md:col-span-2 xl:col-span-3 bg-sc-panel border border-sc-grey/10 border-dashed p-12 text-center">
        <p class="text-sc-grey/50 uppercase tracking-widest">No organization stockpiles indexed.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useStockpileStore } from '../stores/stockpile';

const stockpileStore = useStockpileStore();

onMounted(() => {
  stockpileStore.fetchStockpiles();
});
</script>
