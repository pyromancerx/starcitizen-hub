<template>
  <div v-if="show" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-sc-dark border border-sc-blue/30 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-bold text-white mb-4">Edit Phase</h3>
      <form @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label for="edit-phase-name" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Phase Name</label>
          <input 
            id="edit-phase-name"
            v-model="form.name"
            type="text"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none"
            required
          />
        </div>
        <div>
          <label for="edit-phase-description" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Description</label>
          <textarea 
            id="edit-phase-description"
            v-model="form.description"
            rows="3"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none resize-y"
          ></textarea>
        </div>
        <div>
          <label for="edit-phase-sort-order" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Sort Order</label>
          <input 
            id="edit-phase-sort-order"
            v-model.number="form.sort_order"
            type="number"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none"
          />
        </div>

        <div class="flex gap-3 pt-2">
          <button 
            type="button"
            @click="$emit('close')"
            class="flex-1 px-4 py-2 text-sc-grey hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            :disabled="isLoading"
            class="flex-1 px-4 py-2 bg-sc-blue hover:bg-sc-light-blue disabled:opacity-50 disabled:cursor-not-allowed text-sc-dark rounded font-bold uppercase tracking-widest text-sm transition-colors"
          >
            {{ isLoading ? 'Updating...' : 'Update Phase' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';
import { useProjectStore } from '../stores/project';

const props = defineProps({
  show: Boolean,
  phase: Object,
});

const emit = defineEmits(['close', 'phase-updated']);

const projectStore = useProjectStore();
const isLoading = ref(false);

const form = ref({
  name: '',
  description: '',
  sort_order: 0,
});

watch(() => props.phase, (newVal) => {
  if (newVal) {
    form.value.name = newVal.name;
    form.value.description = newVal.description;
    form.value.sort_order = newVal.sort_order;
  }
}, { immediate: true });

const submitForm = async () => {
  isLoading.value = true;
  try {
    const updatedData = {
      name: form.value.name,
      description: form.value.description || null,
      sort_order: form.value.sort_order,
    };
    await projectStore.updatePhase(props.phase.id, updatedData);
    emit('phase-updated');
    emit('close');
  } catch (error) {
    alert(error.message || 'Failed to update phase.');
  } finally {
    isLoading.value = false;
  }
};
</script>