<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Fleet Registry</h2>
      <div class="flex items-center space-x-3">
        <button @click="triggerFileInput" class="px-4 py-2 bg-sc-grey/10 border border-sc-grey/30 text-sc-grey text-xs font-bold uppercase tracking-widest hover:bg-sc-grey/20 transition-all flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          Import RSI Hangar
        </button>
        <input type="file" ref="fileInput" @change="handleFileUpload" accept=".json" class="hidden" />
        <button @click="showAddModal = true" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
          Register Vessel
        </button>
      </div>
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
          <div class="flex justify-between text-xs items-center">
            <span class="text-sc-grey/50 uppercase">Status</span>
            <select 
              :value="ship.status" 
              @change="updateShipStatus(ship, $event.target.value)"
              class="bg-black/30 border border-sc-grey/30 rounded px-2 py-0.5 text-[10px] text-white focus:border-sc-blue focus:outline-none"
              :class="{
                'text-green-400': ship.status === 'ready',
                'text-yellow-400': ship.status === 'damaged',
                'text-red-400': ship.status === 'destroyed'
              }"
            >
              <option value="ready">READY</option>
              <option value="damaged">DAMAGED</option>
              <option value="destroyed">DESTROYED</option>
              <option value="stored">STORED</option>
            </select>
          </div>
          <div class="pt-2 border-t border-sc-grey/5 flex justify-end">
            <button class="text-[10px] text-sc-blue/70 hover:text-sc-blue uppercase font-bold tracking-widest">View Loadout</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <AddShipModal :show="showAddModal" @close="showAddModal = false" @add-ship="handleAddShip" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useShipStore } from '../stores/assets';
import AddShipModal from '../components/AddShipModal.vue';

const shipStore = useShipStore();
const showAddModal = ref(false);
const fileInput = ref(null);

onMounted(() => {
  shipStore.fetchShips();
});

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const json = JSON.parse(e.target.result);
      const res = await shipStore.importHangarXPLORER(json);
      alert(res.message);
    } catch (err) {
      console.error('Failed to import hangar', err);
      alert('Error parsing JSON file. Please ensure it is a valid HangarXPLORER export.');
    }
  };
  reader.readAsText(file);
};

const handleAddShip = async (newShipData) => {
  await shipStore.addShip(newShipData);
  showAddModal.value = false;
};

const updateShipStatus = async (ship, newStatus) => {
  try {
    await shipStore.updateShip(ship.id, { status: newStatus });
  } catch (e) {
    console.error('Failed to update ship status', e);
  }
};
</script>
