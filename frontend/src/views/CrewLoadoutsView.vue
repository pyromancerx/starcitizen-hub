<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Crew Loadouts</h2>
      <div class="flex gap-3">
        <button @click="showCrewLoadoutTemplatesModal = true" class="px-4 py-2 border border-sc-grey/30 text-sc-grey text-xs font-bold uppercase tracking-widest hover:text-white hover:border-sc-grey transition-all">
          Templates
        </button>
        <button @click="showAddEditCrewLoadoutModal = true; editingLoadout = null" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
          Create Loadout
        </button>
      </div>
    </div>

    <div v-if="crewStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else-if="crewStore.loadouts.length === 0" class="bg-sc-panel border border-sc-grey/10 p-12 text-center">
      <p class="text-sc-grey uppercase tracking-widest">No crew loadouts created yet.</p>
      <p class="text-sc-grey/50 text-sm mt-2">Create loadouts to quickly assemble crews for your ships!</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="loadout in crewStore.loadouts" :key="loadout.id" 
        class="bg-sc-panel border border-sc-grey/10 rounded-lg p-4 hover:border-sc-blue/30 transition-all">
        <div class="flex justify-between items-start mb-3">
          <div>
            <div class="text-lg font-bold text-white">{{ loadout.name }}</div>
            <div v-if="loadout.ship_name" class="text-sm text-sc-blue">{{ loadout.ship_name }}</div>
            <div v-else class="text-sm text-sc-grey">No ship assigned</div>
          </div>
          <div class="flex gap-2">
            <button @click="duplicateLoadout(loadout)" class="text-sc-grey hover:text-sc-blue transition-colors" title="Duplicate">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </button>
            <button @click="deleteLoadout(loadout.id)" class="text-sc-grey hover:text-red-500 transition-colors" title="Delete">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </div>
        
        <div class="space-y-2 mb-4">
          <div v-for="(position, idx) in loadout.positions" :key="idx" 
            class="flex items-center justify-between bg-black/20 rounded px-3 py-2">
            <div class="flex items-center gap-2">
              <span class="text-sc-blue text-xs uppercase">{{ position.role }}</span>
              <span v-if="position.user_display_name" class="text-white text-sm">
                {{ position.user_display_name }}
              </span>
              <span v-else class="text-sc-grey text-sm italic">Unassigned</span>
            </div>
          </div>
          <div v-if="loadout.positions.length === 0" class="text-sc-grey text-sm italic">
            No positions defined
          </div>
        </div>
        
        <div class="flex gap-2 pt-3 border-t border-sc-grey/10">
          <button @click="openEditModal(loadout)" 
            class="flex-1 py-1.5 border border-sc-grey/30 text-sc-grey text-xs uppercase tracking-widest hover:text-white hover:border-sc-grey transition-all">
            Edit
          </button>
          <button @click="deployLoadout(loadout)" 
            class="flex-1 py-1.5 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
            Deploy
          </button>
        </div>
        
        <div class="text-xs text-sc-grey/50 mt-2">
          Updated {{ formatTimeAgo(loadout.updated_at) }}
        </div>
      </div>
    </div>

    <AddEditCrewLoadoutModal
      :show="showAddEditCrewLoadoutModal"
      :loadout="editingLoadout"
      @close="showAddEditCrewLoadoutModal = false"
      @loadout-saved="handleLoadoutSaved"
    />

    <CrewLoadoutTemplatesModal
      :show="showCrewLoadoutTemplatesModal"
      @close="showCrewLoadoutTemplatesModal = false"
      @use-template="handleUseTemplate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useCrewStore } from '../stores/crew';
import AddEditCrewLoadoutModal from '../components/AddEditCrewLoadoutModal.vue';
import CrewLoadoutTemplatesModal from '../components/CrewLoadoutTemplatesModal.vue';
// Ensure memberStore is properly imported and used where needed in modals

const crewStore = useCrewStore();
const showAddEditCrewLoadoutModal = ref(false);
const editingLoadout = ref(null);
const showCrewLoadoutTemplatesModal = ref(false);

onMounted(() => {
  crewStore.fetchLoadouts();
  crewStore.fetchLoadoutTemplates(); // Ensure templates are fetched for the modal
});

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  return `${diffDays} days ago`;
};

const openEditModal = (loadout) => {
  editingLoadout.value = { ...loadout };
  showAddEditCrewLoadoutModal.value = true;
};

const handleLoadoutSaved = () => {
  showAddEditCrewLoadoutModal.value = false;
  editingLoadout.value = null; // Clear editing state
  crewStore.fetchLoadouts(); // Refresh the list of loadouts
  crewStore.fetchLoadoutTemplates(); // Also refresh templates in case a new template was saved
};

const duplicateLoadout = async (loadout) => {
  const newName = prompt('Enter name for the duplicate:', `${loadout.name} (Copy)`);
  if (newName) {
    try {
      await crewStore.duplicateLoadout(loadout.id, newName);
      alert('Loadout duplicated successfully!');
      crewStore.fetchLoadouts(); // Refresh list
    } catch (e) {
      console.error('Failed to duplicate loadout:', e);
      alert('Failed to duplicate loadout.');
    }
  }
};

const deleteLoadout = async (id) => {
  if (confirm('Are you sure you want to delete this loadout?')) {
    try {
      await crewStore.deleteLoadout(id);
      alert('Loadout deleted successfully!');
      crewStore.fetchLoadouts(); // Refresh list
    } catch (e) {
      console.error('Failed to delete loadout:', e);
      alert('Failed to delete loadout.');
    }
  }
};

const deployLoadout = async (loadout) => {
  if (confirm(`Deploy "${loadout.name}"? This will create a deployed copy.`)) {
    try {
      await crewStore.deployLoadout(loadout.id);
      alert('Loadout deployed successfully!');
      // Optionally refresh loadouts or show a notification that it's deployed
    } catch (e) {
      console.error('Failed to deploy loadout:', e);
      alert('Failed to deploy loadout.');
    }
  }
};

const handleUseTemplate = (template) => {
  showCrewLoadoutTemplatesModal.value = false;
  showAddEditCrewLoadoutModal.value = true;
  editingLoadout.value = {
    name: `${template.name} (Copy)`,
    ship_id: null, // User will assign a ship
    positions: template.positions.map(p => ({ role: p.role, user_id: null })), // Clear assigned users
    is_template: false // Not a template anymore when using it
  };
};
</script>
