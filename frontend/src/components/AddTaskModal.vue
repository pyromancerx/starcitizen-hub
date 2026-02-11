<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-sc-dark p-6 rounded-lg shadow-lg w-full max-w-md border border-sc-grey/20">
      <h3 class="text-xl font-bold text-white mb-4">Add New Task</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="taskTitle" class="block text-sc-grey text-sm font-bold mb-2">Task Title</label>
          <input type="text" id="taskTitle" v-model="newTask.title"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="description" class="block text-sc-grey text-sm font-bold mb-2">Description (Optional)</label>
          <textarea id="description" v-model="newTask.description" rows="3"
                    class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue"></textarea>
        </div>
        <div>
          <label for="status" class="block text-sc-grey text-sm font-bold mb-2">Status</label>
          <select id="status" v-model="newTask.status"
                  class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue">
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div>
          <label for="priority" class="block text-sc-grey text-sm font-bold mb-2">Priority</label>
          <input type="number" id="priority" v-model.number="newTask.priority"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" min="0" />
        </div>
        <div>
          <label for="assignee" class="block text-sc-grey text-sm font-bold mb-2">Assignee (Optional)</label>
          <select id="assignee" v-model="newTask.assignee_id"
                  class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue">
            <option :value="null">Unassigned</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.display_name || user.email }}
            </option>
          </select>
        </div>
        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            Add Task
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted } from 'vue';
import api from '../services/api'; // For fetching users

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['close', 'add-task']);

const newTask = ref({
  title: '',
  description: '',
  status: 'todo',
  priority: 0,
  assignee_id: null
});

const users = ref([]);

onMounted(async () => {
  await fetchUsers();
});

const fetchUsers = async () => {
  try {
    // Assuming a general endpoint for fetching users or using the admin one for now
    const response = await api.get('/admin/members_json'); 
    users.value = response.data;
  } catch (err) {
    console.error('Failed to fetch users for task assignment:', err);
  }
};

const handleSubmit = () => {
  emit('add-task', { ...newTask.value });
  // Reset form after submission
  newTask.value = {
    title: '',
    description: '',
    status: 'todo',
    priority: 0,
    assignee_id: null
  };
};
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
