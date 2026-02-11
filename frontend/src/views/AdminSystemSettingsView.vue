<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">System Settings Management</h2>
      <button @click="showAddSettingModal = true" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">Add New Setting</button>
    </div>

    <div v-if="systemStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden shadow-2xl">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-black/20 text-[10px] text-sc-grey/50 uppercase tracking-widest font-bold">
            <th class="p-4 border-b border-sc-grey/10">Key</th>
            <th class="p-4 border-b border-sc-grey/10">Value</th>
            <th class="p-4 border-b border-sc-grey/10">Description</th>
            <th class="p-4 border-b border-sc-grey/10">Public</th>
            <th class="p-4 border-b border-sc-grey/10">Updated At</th>
            <th class="p-4 border-b border-sc-grey/10 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-if="systemStore.settings.length === 0">
            <td colspan="6" class="p-4 text-center text-sc-grey/50">No system settings found.</td>
          </tr>
          <tr v-for="setting in systemStore.settings" :key="setting.key" class="hover:bg-white/5 border-b border-sc-grey/5 transition-colors">
            <td class="p-4 font-bold text-white">{{ setting.key }}</td>
            <td class="p-4 text-sc-grey/70 truncate max-w-xs">{{ setting.value }}</td>
            <td class="p-4 text-sc-grey/70">{{ setting.description || 'N/A' }}</td>
            <td class="p-4">
              <span v-if="setting.is_public" class="text-green-500">Yes</span>
              <span v-else class="text-red-500">No</span>
            </td>
            <td class="p-4 text-sc-grey/70">{{ formatDate(setting.updated_at) }}</td>
            <td class="p-4 text-right">
              <button @click="openEditModal(setting)" class="px-3 py-1 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-black uppercase tracking-widest rounded hover:bg-sc-blue hover:text-sc-dark transition-all mr-2">Edit</button>
              <button @click="handleDeleteSetting(setting.key)" class="px-3 py-1 bg-red-500/10 border border-red-500 text-red-500 text-[10px] font-black uppercase tracking-widest rounded hover:bg-red-500 hover:text-sc-dark transition-all">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AddSystemSettingModal :show="showAddSettingModal" @close="showAddSettingModal = false" @setting-added="systemStore.fetchAllSettings()" />
    <EditSystemSettingModal :show="showEditSettingModal" @close="showEditSettingModal = false" @setting-updated="systemStore.fetchAllSettings()" :setting="editingSetting" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSystemStore } from '../stores/system';
import AddSystemSettingModal from '../components/AddSystemSettingModal.vue';
import EditSystemSettingModal from '../components/EditSystemSettingModal.vue';

const systemStore = useSystemStore();

const showAddSettingModal = ref(false);
const showEditSettingModal = ref(false);
const editingSetting = ref(null);

const openEditModal = (setting) => {
  editingSetting.value = { ...setting };
  showEditSettingModal.value = true;
};

const handleDeleteSetting = async (key) => {
  if (confirm(`Are you sure you want to delete the setting '${key}'? This cannot be undone.`)) {
    try {
      await systemStore.deleteSetting(key);
      alert('Setting deleted successfully!');
    } catch (error) {
      alert(error.message || 'Failed to delete setting.');
    }
  }
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

onMounted(() => {
  systemStore.fetchAllSettings();
});
</script>