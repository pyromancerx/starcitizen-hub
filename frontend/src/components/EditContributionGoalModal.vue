<template>
  <div v-if="show" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-sc-dark border border-sc-blue/30 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-bold text-white mb-4">Edit Contribution Goal</h3>
      <form @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label for="edit-goal-resource-type" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Resource Type</label>
          <input 
            id="edit-goal-resource-type"
            v-model="form.resource_type"
            type="text"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none"
            required
          />
        </div>
        <div>
          <label for="edit-goal-target-amount" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Target Amount</label>
          <input 
            id="edit-goal-target-amount"
            v-model.number="form.target_amount"
            type="number"
            min="1"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none"
            required
          />
        </div>
        <div>
          <label for="edit-goal-unit" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Unit</label>
          <input 
            id="edit-goal-unit"
            v-model="form.unit"
            type="text"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none"
            required
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
            {{ isLoading ? 'Updating...' : 'Update Goal' }}
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
  goal: Object,
});

const emit = defineEmits(['close', 'goal-updated']);

const projectStore = useProjectStore();
const isLoading = ref(false);

const form = ref({
  resource_type: '',
  target_amount: 0,
  unit: 'units',
});

watch(() => props.goal, (newVal) => {
  if (newVal) {
    form.value.resource_type = newVal.resource_type;
    form.value.target_amount = newVal.target_amount;
    form.value.unit = newVal.unit;
  }
}, { immediate: true });

const submitForm = async () => {
  isLoading.value = true;
  try {
    const updatedData = {
      resource_type: form.value.resource_type,
      target_amount: form.value.target_amount,
      unit: form.value.unit,
    };
    await projectStore.updateContributionGoal(props.goal.id, updatedData);
    emit('goal-updated');
    emit('close');
  } catch (error) {
    alert(error.message || 'Failed to update contribution goal.');
  } finally {
    isLoading.value = false;
  }
};
</script>