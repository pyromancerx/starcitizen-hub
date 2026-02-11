<template>
  <div v-if="show" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-sc-dark border border-sc-blue/30 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-bold text-white mb-4">Edit Task</h3>
      <form @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label for="edit-task-title" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Title</label>
          <input 
            id="edit-task-title"
            v-model="form.title"
            type="text"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none"
            required
          />
        </div>
        <div>
          <label for="edit-task-description" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Description</label>
          <textarea 
            id="edit-task-description"
            v-model="form.description"
            rows="3"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none resize-y"
          ></textarea>
        </div>
        <div>
          <label for="edit-task-status" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Status</label>
          <select
            id="edit-task-status"
            v-model="form.status"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none"
          >
            <option v-for="statusOption in taskStatuses" :key="statusOption" :value="statusOption">{{ statusOption }}</option>
          </select>
        </div>
        <div>
          <label for="edit-task-priority" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Priority</label>
          <input 
            id="edit-task-priority"
            v-model.number="form.priority"
            type="number"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none"
          />
        </div>
        <div>
          <label for="edit-task-assignee" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Assignee (User ID)</label>
          <input 
            id="edit-task-assignee"
            v-model.number="form.assignee_id"
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
            {{ isLoading ? 'Updating...' : 'Update Task' }}
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
  task: Object,
});

const emit = defineEmits(['close', 'task-updated']);

const projectStore = useProjectStore();
const isLoading = ref(false);

const form = ref({
  title: '',
  description: '',
  status: 'todo',
  priority: 0,
  assignee_id: null,
});

const taskStatuses = ['todo', 'in_progress', 'review', 'done'];

watch(() => props.task, (newVal) => {
  if (newVal) {
    form.value.title = newVal.title;
    form.value.description = newVal.description;
    form.value.status = newVal.status;
    form.value.priority = newVal.priority;
    form.value.assignee_id = newVal.assignee_id;
  }
}, { immediate: true });

const submitForm = async () => {
  isLoading.value = true;
  try {
    const updatedData = {
      title: form.value.title,
      description: form.value.description || null,
      status: form.value.status,
      priority: form.value.priority,
      assignee_id: form.value.assignee_id || null,
    };
    await projectStore.updateTask(props.task.id, updatedData);
    emit('task-updated');
    emit('close');
  } catch (error) {
    alert(error.message || 'Failed to update task.');
  } finally {
    isLoading.value = false;
  }
};
</script>