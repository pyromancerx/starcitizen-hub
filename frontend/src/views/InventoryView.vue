<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Personal Inventory</h2>
      <div class="flex space-x-2">
        <input type="text" placeholder="Search items..." class="bg-black/30 border border-sc-grey/20 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-sc-blue/50" />
      </div>
    </div>

    <div v-if="inventoryStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden shadow-xl">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-black/20 text-[10px] text-sc-grey/50 uppercase tracking-widest font-bold">
            <th class="p-4 border-b border-sc-grey/10 text-center w-16">Qty</th>
            <th class="p-4 border-b border-sc-grey/10">Item Name</th>
            <th class="p-4 border-b border-sc-grey/10">Type</th>
            <th class="p-4 border-b border-sc-grey/10">Location</th>
            <th class="p-4 border-b border-sc-grey/10 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-for="item in inventoryStore.items" :key="item.id" class="hover:bg-white/5 border-b border-sc-grey/5 transition-colors group">
            <td class="p-4 text-center font-mono text-sc-blue font-bold">{{ item.quantity }}</td>
            <td class="p-4 text-white font-semibold">{{ item.item_name }}</td>
            <td class="p-4"><span class="px-2 py-0.5 rounded-full bg-sc-grey/10 text-[10px] uppercase text-sc-grey">{{ item.item_type }}</span></td>
            <td class="p-4 text-sc-grey/70 text-xs italic">{{ item.location || 'Unknown Space' }}</td>
            <td class="p-4 text-right">
              <button class="text-sc-grey/30 hover:text-sc-blue transition-colors">
                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M3 17.25V21h3.25L16.24 11.01l-3.25-3.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.25 3.25 1.83-1.83z"></path></svg>
              </button>
            </td>
          </tr>
          <tr v-if="inventoryStore.items.length === 0">
            <td colspan="5" class="p-12 text-center text-sc-grey/50 uppercase tracking-widest italic">Inventory scanners offline. No items found.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useInventoryStore } from '../stores/assets';

const inventoryStore = useInventoryStore();

onMounted(() => {
  inventoryStore.fetchInventory();
});
</script>
