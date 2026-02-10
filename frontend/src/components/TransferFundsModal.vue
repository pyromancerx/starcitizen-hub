<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-sc-dark p-6 rounded-lg shadow-lg w-full max-w-md border border-sc-grey/20">
      <h3 class="text-xl font-bold text-white mb-4">Transfer Funds</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="recipient" class="block text-sc-grey text-sm font-bold mb-2">Recipient (User ID or Name)</label>
          <input type="text" id="recipient" v-model="transferData.recipient_id"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="amount" class="block text-sc-grey text-sm font-bold mb-2">Amount (aUEC)</label>
          <input type="number" id="amount" v-model.number="transferData.amount"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" min="1" required />
        </div>
        <div>
          <label for="description" class="block text-sc-grey text-sm font-bold mb-2">Description (Optional)</label>
          <textarea id="description" v-model="transferData.description" rows="3"
                    class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue"></textarea>
        </div>
        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            Transfer
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

const emit = defineEmits(['close', 'transfer-funds']);

const transferData = ref({
  recipient_user_id: '', // This could be a user ID or a username
  amount: null,
  description: ''
});

const handleSubmit = () => {
  emit('transfer-funds', { ...transferData.value });
  // Reset form after submission
  transferData.value = {
    recipient_user_id: '',
    amount: null,
    description: ''
  };
};
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
