<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Audit Log</h2>

    <!-- Filters -->
    <div class="bg-sc-panel border border-sc-grey/10 rounded-lg p-4 flex flex-wrap gap-4 items-end">
      <div>
        <label for="filter_user_id" class="block text-xs text-sc-grey uppercase tracking-widest mb-1">User ID</label>
        <input type="number" id="filter_user_id" v-model.number="filters.user_id" @input="debouncedFetchLogs"
               class="w-32 bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none" />
      </div>
      <div>
        <label for="filter_action" class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Action</label>
        <input type="text" id="filter_action" v-model="filters.action" @input="debouncedFetchLogs"
               class="w-48 bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none" />
      </div>
      <div>
        <label for="filter_target_type" class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Target Type</label>
        <input type="text" id="filter_target_type" v-model="filters.target_type" @input="debouncedFetchLogs"
               class="w-48 bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none" />
      </div>
      <button @click="clearFilters" class="px-4 py-2 border border-sc-grey/30 text-sc-grey hover:text-white text-xs uppercase tracking-widest">
        Clear Filters
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-black/20 text-[10px] text-sc-grey/50 uppercase tracking-widest font-bold">
            <th class="p-4 border-b border-sc-grey/10">ID</th>
            <th class="p-4 border-b border-sc-grey/10">Timestamp</th>
            <th class="p-4 border-b border-sc-grey/10">User</th>
            <th class="p-4 border-b border-sc-grey/10">Action</th>
            <th class="p-4 border-b border-sc-grey/10">Target</th>
            <th class="p-4 border-b border-sc-grey/10">Details</th>
            <th class="p-4 border-b border-sc-grey/10">IP Address</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-if="auditLogs.length === 0">
            <td colspan="7" class="p-4 text-center text-sc-grey/50">No audit logs found.</td>
          </tr>
          <tr v-for="log in auditLogs" :key="log.id" class="hover:bg-white/5 border-b border-sc-grey/5 transition-colors">
            <td class="p-4">{{ log.id }}</td>
            <td class="p-4 text-sc-grey/70">{{ formatDateTime(log.created_at) }}</td>
            <td class="p-4 text-sc-blue font-bold">{{ log.user?.display_name || `ID: ${log.user_id}` || 'System' }}</td>
            <td class="p-4 text-white">{{ log.action }}</td>
            <td class="p-4 text-sc-grey/70">{{ log.target_type }} <span v-if="log.target_id">({{ log.target_id }})</span></td>
            <td class="p-4 text-sc-grey/70 truncate max-w-xs">{{ JSON.stringify(log.details) }}</td>
            <td class="p-4 text-sc-grey/70">{{ log.ip_address || 'N/A' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex justify-between items-center mt-4">
      <button :disabled="currentPage === 1 || isLoading" @click="changePage(currentPage - 1)"
              class="px-4 py-2 border border-sc-grey/30 text-sc-grey hover:text-white hover:border-sc-grey transition-all text-xs uppercase tracking-widest disabled:opacity-50">
        Previous
      </button>
      <span class="text-sc-grey">Page {{ currentPage }}</span>
      <button :disabled="auditLogs.length < filters.limit || isLoading" @click="changePage(currentPage + 1)"
              class="px-4 py-2 border border-sc-grey/30 text-sc-grey hover:text-white hover:border-sc-grey transition-all text-xs uppercase tracking-widest disabled:opacity-50">
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import AuditService from '../services/AuditService';

const auditLogs = ref([]);
const isLoading = ref(true);
const currentPage = ref(1);
const filters = ref({
  limit: 50,
  user_id: null,
  action: '',
  target_type: '',
});

let debounceTimer;

const fetchAuditLogs = async () => {
  isLoading.value = true;
  try {
    const fetchedFilters = { ...filters.value, page: currentPage.value };
    // Remove null or empty string filters to not send them to backend
    Object.keys(fetchedFilters).forEach(key => {
      if (fetchedFilters[key] === null || fetchedFilters[key] === '') {
        delete fetchedFilters[key];
      }
    });
    auditLogs.value = await AuditService.getAuditLogs(fetchedFilters);
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    auditLogs.value = [];
    alert('Failed to load audit logs.');
  } finally {
    isLoading.value = false;
  }
};

const debouncedFetchLogs = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    currentPage.value = 1; // Reset to first page on filter change
    fetchAuditLogs();
  }, 500);
};

const changePage = (page) => {
  if (page < 1) return;
  currentPage.value = page;
  fetchAuditLogs();
};

const clearFilters = () => {
  filters.value.user_id = null;
  filters.value.action = '';
  filters.value.target_type = '';
  currentPage.value = 1;
  fetchAuditLogs();
};

const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  const options = {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false // 24-hour format
  };
  return date.toLocaleString(undefined, options);
};

onMounted(fetchAuditLogs);
</script>

<style scoped>
/* Scoped styles for AdminAuditLogView */
</style>
