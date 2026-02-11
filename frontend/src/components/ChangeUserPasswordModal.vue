<template>
  <div v-if="show" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-sc-dark border border-sc-blue/30 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-bold text-white mb-4">Change User Password</h3>
      <form @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label for="new-password" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">New Password</label>
          <input 
            id="new-password"
            v-model="form.new_password"
            type="password"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none"
            required
          />
        </div>
        <div>
          <label for="confirm-password" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Confirm New Password</label>
          <input 
            id="confirm-password"
            v-model="form.confirm_password"
            type="password"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none"
            required
          />
          <p v-if="passwordMismatch" class="text-red-500 text-xs mt-1">Passwords do not match.</p>
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
            :disabled="isLoading || passwordMismatch"
            class="flex-1 px-4 py-2 bg-sc-blue hover:bg-sc-light-blue disabled:opacity-50 disabled:cursor-not-allowed text-sc-dark rounded font-bold uppercase tracking-widest text-sm transition-colors"
          >
            {{ isLoading ? 'Changing...' : 'Change Password' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';
import { useAdminStore } from '../stores/admin';

const props = defineProps({
  show: Boolean,
  userId: Number,
});

const emit = defineEmits(['close', 'password-changed']);

const adminStore = useAdminStore();
const isLoading = ref(false);

const form = ref({
  new_password: '',
  confirm_password: '',
});

const passwordMismatch = computed(() => {
  return form.value.new_password !== form.value.confirm_password;
});

const submitForm = async () => {
  if (passwordMismatch.value) {
    alert('Passwords do not match.');
    return;
  }
  isLoading.value = true;
  try {
    await adminStore.adminChangeUserPassword(props.userId, form.value.new_password);
    alert('Password changed successfully!');
    emit('password-changed');
    emit('close');
    form.value.new_password = '';
    form.value.confirm_password = '';
  } catch (error) {
    alert(error.message || 'Failed to change password.');
  } finally {
    isLoading.value = false;
  }
};
</script>