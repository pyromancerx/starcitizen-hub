<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Fleet Registry</h2>
      <button @click="showAddModal = true" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
        Register Vessel
      </button>
    </div>

    <div v-if="shipStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else-if="shipStore.ships.length === 0" class="bg-sc-panel border border-sc-grey/10 p-12 text-center">
      <p class="text-sc-grey uppercase tracking-widest">No vessels registered in your fleet.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="ship in shipStore.ships" :key="ship.id" class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden group hover:border-sc-blue/30 transition-all shadow-lg">
        <div class="h-32 bg-gradient-to-br from-sc-light-blue/20 to-sc-dark p-4 flex flex-col justify-end">
          <div class="text-xs text-sc-blue font-bold uppercase tracking-tighter">{{ ship.ship_type }}</div>
          <div class="text-xl font-bold text-white truncate">{{ ship.name || 'Unnamed Vessel' }}</div>
        </div>
        <div class="p-4 space-y-3">
          <div class="flex justify-between text-xs">
            <span class="text-sc-grey/50 uppercase">Serial</span>
            <span class="text-sc-grey">{{ ship.serial_number || 'N/A' }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-sc-grey/50 uppercase">Insurance</span>
            <span :class="ship.insurance_status === 'active' ? 'text-green-400' : 'text-yellow-500'">{{ ship.insurance_status || 'Unknown' }}</span>
          </div>
          <div class="pt-2 border-t border-sc-grey/5 flex justify-end">
            <button class="text-[10px] text-sc-blue/70 hover:text-sc-blue uppercase font-bold tracking-widest">View Loadout</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useShipStore } from '../stores/assets';

const shipStore = useShipStore();
const showAddModal = ref(false);

onMounted(() => {
  shipStore.fetchShips();
});
</script>
