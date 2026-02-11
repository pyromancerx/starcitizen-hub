<template>
  <div v-if="show" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-sc-dark border border-sc-blue/30 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-bold text-white mb-4">Edit Project</h3>
      <form @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label for="edit-project-title" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Title</label>
          <input 
            id="edit-project-title"
            v-model="form.title"
            type="text"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none"
            required
          />
        </div>
        <div>
          <label for="edit-project-description" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Description</label>
          <textarea 
            id="edit-project-description"
            v-model="form.description"
            rows="3"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none resize-y"
          ></textarea>
        </div>
        <div>
          <label for="edit-project-status" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Status</label>
          <select
            id="edit-project-status"
            v-model="form.status"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none"
          >
            <option v-for="statusOption in projectStatuses" :key="statusOption" :value="statusOption">{{ statusOption }}</option>
          </select>
        </div>
        <div>
          <label for="edit-project-target-date" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Target Completion Date</label>
          <input 
            id="edit-project-target-date"
            v-model="form.target_date"
            type="date"
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
            {{ isLoading ? 'Updating...' : 'Update Project' }}
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
  project: Object,
});

const emit = defineEmits(['close', 'project-updated']);

const projectStore = useProjectStore();
const isLoading = ref(false);

const form = ref({
  title: '',
  description: '',
  status: 'planning',
  target_date: '',
});

const projectStatuses = ['planning', 'in_progress', 'paused', 'completed', 'cancelled'];

watch(() => props.project, (newVal) => {
  if (newVal) {
    form.value.title = newVal.title;
    form.value.description = newVal.description;
    form.value.status = newVal.status;
    form.value.target_date = newVal.target_date ? new Date(newVal.target_date).toISOString().split('T')[0] : '';
  }
}, { immediate: true });

const submitForm = async () => {
  isLoading.value = true;
  try {
    const updatedData = {
      title: form.value.title,
      description: form.value.description || null,
      status: form.value.status,
      target_date: form.value.target_date ? new Date(form.value.target_date).toISOString() : null,
    };
    await projectStore.updateProject(props.project.id, updatedData);
    emit('project-updated');
    emit('close');
  } catch (error) {
    alert(error.message || 'Failed to update project.');
  } finally {
    isLoading.value = false;
  }
};
</script>