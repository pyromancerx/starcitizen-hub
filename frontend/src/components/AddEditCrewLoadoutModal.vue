<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-bold text-white uppercase tracking-widest mb-4">
        {{ isEditMode ? 'Edit Loadout' : 'Create Loadout' }}
      </h3>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
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
        
        <div v-if="error" class="text-red-500 text-sm text-center">
          {{ error }}
        </div>
        
        <div class="flex gap-3 pt-4">
          <button type="button" @click="$emit('close')"
            class="flex-1 py-2 border border-sc-grey/30 text-sc-grey hover:text-white hover:border-sc-grey transition-all text-xs uppercase tracking-widest">
            Cancel
          </button>
          <button type="submit" :disabled="isLoading"
            class="flex-1 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue hover:bg-sc-blue/20 transition-all text-xs uppercase tracking-widest disabled:opacity-50">
            {{ isLoading ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, computed, onMounted } from 'vue';
import { useCrewStore } from '../stores/crew';
import ShipService from '../services/ShipService'; // Assuming you have a ShipService
import { useMemberStore } from '../stores/members'; // Assuming you have a MemberStore

const props = defineProps({
  show: Boolean,
  loadout: Object // Optional, for editing an existing loadout
});

const emit = defineEmits(['close', 'loadout-saved']);

const crewStore = useCrewStore();
const memberStore = useMemberStore(); // Need to fetch members
const isLoading = ref(false);
const error = ref(null);

const ships = ref([]);
const members = ref([]); // Will be populated from memberStore

const defaultForm = {
  name: '',
  ship_id: null,
  positions: [{ role: '', user_id: null }],
  is_template: false
};

const loadoutForm = ref({ ...defaultForm });

const isEditMode = computed(() => !!props.loadout);

onMounted(async () => {
  await fetchShips();
  await memberStore.fetchMembers(); // Ensure members are fetched
  members.value = memberStore.members;
});

watch(() => props.loadout, (newVal) => {
  if (newVal) {
    loadoutForm.value = { 
      ...newVal,
      positions: newVal.positions ? newVal.positions.map(p => ({ ...p })) : [{ role: '', user_id: null }]
    };
  } else {
    resetForm();
  }
}, { immediate: true });

watch(() => props.show, (newVal) => {
  if (newVal && !isEditMode.value) {
    resetForm();
  }
});

const fetchShips = async () => {
  try {
    ships.value = await ShipService.getMyShips(); // Assuming ShipService.getMyShips exists
  } catch (err) {
    console.error('Failed to fetch ships:', err);
    error.value = 'Failed to load ships for selection.';
  }
};

const addPosition = () => {
  loadoutForm.value.positions.push({ role: '', user_id: null });
};

const removePosition = (idx) => {
  loadoutForm.value.positions.splice(idx, 1);
};

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    let result;
    const payload = {
      ...loadoutForm.value,
      positions: loadoutForm.value.positions.filter(p => p.role.trim()) // Filter out empty roles
    };

    if (isEditMode.value) {
      result = await crewStore.updateLoadout(props.loadout.id, payload);
      alert('Loadout updated successfully!');
    } else {
      result = await crewStore.createLoadout(payload);
      alert('Loadout created successfully!');
    }
    emit('loadout-saved', result);
    emit('close');
    resetForm();
  } catch (err) {
    error.value = err.message || 'An unexpected error occurred.';
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  Object.assign(loadoutForm.value, defaultForm);
  loadoutForm.value.positions = [{ role: '', user_id: null }]; // Deep reset for positions
};
</script>

<style scoped>
/* Specific styles for AddEditCrewLoadoutModal */
</style>
