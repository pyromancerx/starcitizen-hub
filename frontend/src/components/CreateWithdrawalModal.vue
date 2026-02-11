<template>
  <div v-if="show" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-sc-dark border border-sc-blue/30 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-bold text-white mb-4">Request Withdrawal</h3>
      <p class="text-sm text-sc-grey mb-4">Withdrawals require admin approval.</p>
      <div class="space-y-4">
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Amount (aUEC)</label>
          <input 
            v-model="transactionForm.amount"
            type="number"
            min="1"
            :max="walletBalance"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none"
            placeholder="Enter amount"
          />
        </div>
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Category</label>
          <select v-model="transactionForm.category" class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none">
            <option value="operation_payout">Operation Payout</option>
            <option value="stockpile_purchase">Stockpile Purchase</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Description</label>
          <textarea 
            v-model="transactionForm.description"
            rows="2"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none resize-none"
            placeholder="Reason for withdrawal"
          ></textarea>
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
            @click="submitWithdrawal"
            :disabled="!canSubmitTransaction || isLoading"
            class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-bold uppercase tracking-widest text-sm transition-colors"
          >
            {{ isLoading ? 'Processing...' : 'Request' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue';
import { useTreasuryStore } from '../stores/treasury';

const props = defineProps({
  show: Boolean,
  walletId: Number,
  walletBalance: Number,
});

const emit = defineEmits(['close', 'transaction-completed']);

const treasuryStore = useTreasuryStore();
const isLoading = ref(false);

const transactionForm = ref({
  amount: '',
  category: 'operation_payout',
  description: '',
});

const canSubmitTransaction = computed(() => {
  return transactionForm.value.amount > 0 && transactionForm.value.amount <= props.walletBalance;
});

const submitWithdrawal = async () => {
  isLoading.value = true;
  try {
    await treasuryStore.createTransaction(
      props.walletId,
      'withdrawal',
      parseInt(transactionForm.value.amount),
      transactionForm.value.category,
      transactionForm.value.description
    );
    emit('transaction-completed');
    emit('close');
    resetForm();
  } catch (err) {
    alert(err.message || 'Failed to request withdrawal.');
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  transactionForm.value = {
    amount: '',
    category: 'operation_payout',
    description: '',
  };
};
</script>

<style scoped>
/* Specific styles for CreateWithdrawalModal */
</style>
