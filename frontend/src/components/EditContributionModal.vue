<template>
  <div v-if="show" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-sc-dark border border-sc-blue/30 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-bold text-white mb-4">Edit Contribution</h3>
      <form @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label for="edit-contribution-amount" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Amount</label>
          <input 
            id="edit-contribution-amount"
            v-model.number="form.amount"
            type="number"
            min="1"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none"
            required
          />
        </div>
        <div>
          <label for="edit-contribution-notes" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Notes</label>
          <textarea 
            id="edit-contribution-notes"
            v-model="form.notes"
            rows="3"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none resize-y"
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
            :disabled="isLoading"
            class="flex-1 px-4 py-2 bg-sc-blue hover:bg-sc-light-blue disabled:opacity-50 disabled:cursor-not-allowed text-sc-dark rounded font-bold uppercase tracking-widest text-sm transition-colors"
          >
            {{ isLoading ? 'Updating...' : 'Update Contribution' }}
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
  contribution: Object,
});

const emit = defineEmits(['close', 'contribution-updated']);

const projectStore = useProjectStore();
const isLoading = ref(false);

const form = ref({
  amount: 0,
  notes: '',
});

watch(() => props.contribution, (newVal) => {
  if (newVal) {
    form.value.amount = newVal.amount;
    form.value.notes = newVal.notes;
  }
}, { immediate: true });

const submitForm = async () => {
  isLoading.value = true;
  try {
    const updatedData = {
      amount: form.value.amount,
      notes: form.value.notes || null,
    };
    await projectStore.updateContribution(props.contribution.id, updatedData);
    emit('contribution-updated');
    emit('close');
  } catch (error) {
    alert(error.message || 'Failed to update contribution.');
  } finally {
    isLoading.value = false;
  }
};
</script>