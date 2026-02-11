<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Crew Loadouts</h2>
      <div class="flex gap-3">
        <button @click="showTemplateModal = true" class="px-4 py-2 border border-sc-grey/30 text-sc-grey text-xs font-bold uppercase tracking-widest hover:text-white hover:border-sc-grey transition-all">
          Templates
        </button>
        <button @click="showAddModal = true" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
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

    <!-- Create/Edit Loadout Modal -->
    <div v-if="showAddModal || editModal.show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="closeModal">
      <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold text-white uppercase tracking-widest mb-4">
          {{ editModal.show ? 'Edit Loadout' : 'Create Loadout' }}
        </h3>
        
        <form @submit.prevent="submitLoadout" class="space-y-4">
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Loadout Name</label>
            <input v-model="loadoutForm.name" type="text" required
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
              placeholder="e.g., Mining Team Alpha">
          </div>
          
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Ship (Optional)</label>
            <select v-model="loadoutForm.ship_id"
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
              <option :value="null">No ship assigned</option>
              <option v-for="ship in ships" :key="ship.id" :value="ship.id">
                {{ ship.name || ship.ship_type }}
              </option>
            </select>
          </div>
          
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-xs text-sc-grey uppercase tracking-widest">Crew Positions</label>
              <button type="button" @click="addPosition" class="text-xs text-sc-blue hover:text-white transition-colors">
                + Add Position
              </button>
            </div>
            
            <div v-for="(position, idx) in loadoutForm.positions" :key="idx" 
              class="flex gap-2 mb-2">
              <input v-model="position.role" type="text" required placeholder="Role (e.g., Pilot)"
                class="flex-1 bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
              <select v-model="position.user_id"
                class="flex-1 bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
                <option :value="null">Unassigned</option>
                <option v-for="member in members" :key="member.id" :value="member.id">
                  {{ member.display_name || member.email }}
                </option>
              </select>
              <button type="button" @click="removePosition(idx)" 
                class="px-2 text-red-500 hover:text-red-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <input v-model="loadoutForm.is_template" type="checkbox" id="is_template"
              class="bg-black/50 border border-sc-grey/30 rounded">
            <label for="is_template" class="text-sm text-sc-grey">Save as template</label>
          </div>
          
          <div v-if="crewStore.error" class="text-red-500 text-sm text-center">
            {{ crewStore.error }}
          </div>
          
          <div class="flex gap-3 pt-4">
            <button type="button" @click="closeModal"
              class="flex-1 py-2 border border-sc-grey/30 text-sc-grey hover:text-white hover:border-sc-grey transition-all text-xs uppercase tracking-widest">
              Cancel
            </button>
            <button type="submit" :disabled="crewStore.isLoading"
              class="flex-1 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue hover:bg-sc-blue/20 transition-all text-xs uppercase tracking-widest disabled:opacity-50">
              {{ crewStore.isLoading ? 'Saving...' : (editModal.show ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Templates Modal -->
    <div v-if="showTemplateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="showTemplateModal = false">
      <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold text-white uppercase tracking-widest mb-4">Loadout Templates</h3>
        
        <div v-if="crewStore.loadoutTemplates.length === 0" class="text-center py-8">
          <p class="text-sc-grey">No templates available.</p>
        </div>
        
        <div v-else class="space-y-3">
          <div v-for="template in crewStore.loadoutTemplates" :key="template.id" 
            class="bg-black/20 rounded p-3">
            <div class="flex justify-between items-start mb-2">
              <div class="font-bold text-white">{{ template.name }}</div>
              <button @click="useTemplate(template)" 
                class="text-xs text-sc-blue hover:text-white transition-colors">
                Use Template
              </button>
            </div>
            <div class="text-xs text-sc-grey">
              {{ template.positions.length }} positions • by {{ template.creator_name || 'Unknown' }}
            </div>
          </div>
        </div>
        
        <div class="mt-6 flex justify-end">
          <button @click="showTemplateModal = false"
            class="px-4 py-2 border border-sc-grey/30 text-sc-grey hover:text-white hover:border-sc-grey transition-all text-xs uppercase tracking-widest">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useCrewStore } from '../stores/crew';
import api from '../services/api';

const crewStore = useCrewStore();
const showAddModal = ref(false);
const showTemplateModal = ref(false);
const editModal = ref({ show: false, loadout: null });
const ships = ref([]);
const members = ref([]);

const loadoutForm = ref({
  name: '',
  ship_id: null,
  positions: [{ role: '', user_id: null }],
  is_template: false
});

onMounted(() => {
  crewStore.fetchLoadouts();
  crewStore.fetchLoadoutTemplates();
  fetchShips();
  fetchMembers();
});

const fetchShips = async () => {
  try {
    const response = await api.get('/ships/');
    ships.value = response.data;
  } catch (err) {
    console.error('Failed to fetch ships:', err);
  }
};

const fetchMembers = async () => {
  // Use members already fetched by memberStore
  members.value = memberStore.members;
};

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

const addPosition = () => {
  loadoutForm.value.positions.push({ role: '', user_id: null });
};

const removePosition = (idx) => {
  loadoutForm.value.positions.splice(idx, 1);
};

const closeModal = () => {
  showAddModal.value = false;
  editModal.value = { show: false, loadout: null };
  resetForm();
};

const resetForm = () => {
  loadoutForm.value = {
    name: '',
    ship_id: null,
    positions: [{ role: '', user_id: null }],
    is_template: false
  };
};

const openEditModal = (loadout) => {
  editModal.value = { show: true, loadout };
  loadoutForm.value = {
    name: loadout.name,
    ship_id: loadout.ship_id,
    positions: loadout.positions.map(p => ({ ...p })),
    is_template: loadout.is_template
  };
};

const submitLoadout = async () => {
  try {
    const formData = {
      ...loadoutForm.value,
      positions: loadoutForm.value.positions.filter(p => p.role.trim())
    };
    
    if (editModal.value.show) {
      await crewStore.updateLoadout(editModal.value.loadout.id, formData);
    } else {
      await crewStore.createLoadout(formData);
    }
    closeModal();
  } catch (e) {
    // Error handled in store
  }
};

const duplicateLoadout = async (loadout) => {
  const newName = prompt('Enter name for the duplicate:', `${loadout.name} (Copy)`);
  if (newName) {
    try {
      await crewStore.duplicateLoadout(loadout.id, newName);
    } catch (e) {
      // Error handled in store
    }
  }
};

const deleteLoadout = async (id) => {
  if (confirm('Are you sure you want to delete this loadout?')) {
    try {
      await crewStore.deleteLoadout(id);
    } catch (e) {
      // Error handled in store
    }
  }
};

const deployLoadout = async (loadout) => {
  if (confirm(`Deploy "${loadout.name}"? This will create a deployed copy.`)) {
    try {
      await crewStore.deployLoadout(loadout.id);
      alert('Loadout deployed successfully!');
    } catch (e) {
      // Error handled in store
    }
  }
};

const useTemplate = (template) => {
  showTemplateModal.value = false;
  showAddModal.value = true;
  loadoutForm.value = {
    name: `${template.name} (Copy)`,
    ship_id: null,
    positions: template.positions.map(p => ({ role: p.role, user_id: null })),
    is_template: false
  };
};
</script>
