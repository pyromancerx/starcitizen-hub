<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-sc-dark p-6 rounded-lg shadow-lg w-full max-w-md border border-sc-grey/20">
      <h3 class="text-xl font-bold text-white mb-4">Invite New User to Organization</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="email" class="block text-sc-grey text-sm font-bold mb-2">User Email</label>
          <input type="email" id="email" v-model="inviteData.email"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="roleId" class="block text-sc-grey text-sm font-bold mb-2">Assign Role (Optional ID)</label>
          <input type="number" id="roleId" v-model.number="inviteData.role_id"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" placeholder="e.g., 1 for Admin" />
          <p class="text-[10px] text-sc-grey/50 mt-1">If left blank, user will receive the default role.</p>
        </div>
        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            Send Invite
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['close', 'invite-user']);

const inviteData = ref({
  email: '',
  role_id: null
});

const handleSubmit = () => {
  emit('invite-user', { ...inviteData.value });
  // Reset form after submission
  inviteData.value = {
    email: '',
    role_id: null
  };
};
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
