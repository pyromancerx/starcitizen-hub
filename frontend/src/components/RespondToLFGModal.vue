<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 w-full max-w-md shadow-2xl">
      <h3 class="text-xl font-bold text-white uppercase tracking-widest mb-4">Respond to LFG</h3>
      
      <div v-if="lfgPost" class="mb-4 p-3 bg-black/30 rounded">
        <div class="text-sm text-sc-blue font-bold">{{ lfgPost.ship_type }} - {{ lfgPost.activity_type }}</div>
        <div v-if="lfgPost.notes" class="text-xs text-sc-grey mt-1 truncate">{{ lfgPost.notes }}</div>
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Role You Can Fill (Optional)</label>
          <input v-model="responseForm.role_offered" type="text"
            class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
            placeholder="e.g., turret gunner">
        </div>
        
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Message (Optional)</label>
          <textarea v-model="responseForm.message" rows="3"
            class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none"
            placeholder="Introduce yourself and your availability..."></textarea>
        </div>
        
        <div v-if="error" class="text-red-500 text-sm text-center">
          {{ error }}
        </div>
        
        <div class="flex gap-3 pt-4">
          <button type="button" @click="$emit('close')"
            class="flex-1 py-2 border border-sc-grey/30 text-sc-grey hover:text-white hover:border-sc-grey transition-all text-xs uppercase tracking-widest">
            Cancel
          </button>
          <button type="submit" :disabled="isLoading"
            class="flex-1 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue hover:bg-sc-blue/20 transition-all text-xs uppercase tracking-widest disabled:opacity-50">
            {{ isLoading ? 'Sending...' : 'Send Response' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';
import { useCrewStore } from '../stores/crew';

const props = defineProps({
  show: Boolean,
  lfgPost: Object
});

const emit = defineEmits(['close', 'response-sent']);

const crewStore = useCrewStore();
const isLoading = ref(false);
const error = ref(null);

const defaultForm = {
  role_offered: '',
  message: ''
};

const responseForm = ref({ ...defaultForm });

watch(() => props.show, (newVal) => {
  if (newVal) {
    resetForm();
  }
});

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    await crewStore.respondToLfg(props.lfgPost.id, responseForm.value);
    emit('response-sent');
    emit('close');
    alert('Your response has been sent!');
    resetForm();
  } catch (err) {
    error.value = err.message || 'An unexpected error occurred.';
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  Object.assign(responseForm.value, defaultForm);
};
</script>

<style scoped>
/* Specific styles for RespondToLFGModal */
</style>
