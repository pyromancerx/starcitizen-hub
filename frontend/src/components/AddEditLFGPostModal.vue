<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 w-full max-w-md shadow-2xl">
      <h3 class="text-xl font-bold text-white uppercase tracking-widest mb-4">{{ isEditMode ? 'Edit LFG Post' : 'Post LFG' }}</h3>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Ship Type</label>
          <input v-model="lfgForm.ship_type" type="text" required
            class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
            placeholder="e.g., Drake Caterpillar">
        </div>
        
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Activity Type</label>
          <select v-model="lfgForm.activity_type" required
            class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
            <option value="">Select activity...</option>
            <option value="mining">Mining</option>
            <option value="cargo">Cargo</option>
            <option value="combat">Combat</option>
            <option value="exploration">Exploration</option>
            <option value="salvage">Salvage</option>
            <option value="social">Social</option>
          </select>
        </div>
        
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Looking For (comma-separated roles)</label>
          <input v-model="rolesInput" type="text"
            class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
            placeholder="e.g., pilot, turret gunner, engineer">
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Scheduled Time (Optional)</label>
            <input v-model="lfgForm.scheduled_time" type="datetime-local"
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
          </div>
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Duration (min)</label>
            <input v-model.number="lfgForm.duration_estimate" type="number" min="15" max="480"
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
          </div>
        </div>
        
        <div v-if="!isEditMode"> <!-- Only for creation, not editing -->
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Expires After (hours)</label>
          <input v-model.number="lfgForm.expires_hours" type="number" min="1" max="168" 
            class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
        </div>
        
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Notes (Optional)</label>
          <textarea v-model="lfgForm.notes" rows="2"
            class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
            placeholder="Any additional details..."></textarea>
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
            {{ isLoading ? 'Saving...' : (isEditMode ? 'Update Post' : 'Post LFG') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, computed } from 'vue';
import { useCrewStore } from '../stores/crew';

const props = defineProps({
  show: Boolean,
  lfgPost: Object // Optional, for editing an existing LFG post
});

const emit = defineEmits(['close', 'lfg-post-saved']);

const crewStore = useCrewStore();
const isLoading = ref(false);
const error = ref(null);

const defaultForm = {
  ship_type: '',
  activity_type: '',
  looking_for_roles: [],
  scheduled_time: '',
  duration_estimate: null,
  expires_hours: 24,
  notes: ''
};

const lfgForm = ref({ ...defaultForm });
const rolesInput = ref('');

const isEditMode = computed(() => !!props.lfgPost);

watch(() => props.lfgPost, (newVal) => {
  if (newVal) {
    lfgForm.value = { ...newVal };
    // Format scheduled_time for datetime-local input
    if (lfgForm.value.scheduled_time) {
      lfgForm.value.scheduled_time = new Date(lfgForm.value.scheduled_time).toISOString().slice(0, 16);
    }
    rolesInput.value = newVal.looking_for_roles ? newVal.looking_for_roles.join(', ') : '';
  } else {
    resetForm();
  }
}, { immediate: true });

watch(() => props.show, (newVal) => {
  if (newVal && !isEditMode.value) {
    resetForm();
  }
});

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    let result;
    const payload = { ...lfgForm.value };
    // Convert scheduled_time to ISO string if provided
    if (payload.scheduled_time) {
      payload.scheduled_time = new Date(payload.scheduled_time).toISOString();
    }
    // Convert comma-separated roles string to array
    payload.looking_for_roles = rolesInput.value.split(',').map(r => r.trim()).filter(Boolean);

    if (isEditMode.value) {
      result = await crewStore.updateLfgPost(props.lfgPost.id, payload);
      alert('LFG post updated successfully!');
    } else {
      result = await crewStore.createLfgPost(payload);
      alert('LFG post created successfully!');
    }
    emit('lfg-post-saved', result);
    emit('close');
    resetForm();
  } catch (err) {
    error.value = err.message || 'An unexpected error occurred.';
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  Object.assign(lfgForm.value, defaultForm);
  rolesInput.value = '';
};
</script>

<style scoped>
/* Specific styles for AddEditLFGPostModal */
</style>
