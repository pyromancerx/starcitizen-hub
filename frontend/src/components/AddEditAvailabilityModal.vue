<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 w-full max-w-md shadow-2xl">
      <h3 class="text-xl font-bold text-white uppercase tracking-widest mb-4">{{ isEditMode ? 'Edit Availability' : 'Set Availability' }}</h3>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Day of Week</label>
          <select v-model="availabilityForm.day_of_week" required
            class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
            <option :value="0">Monday</option>
            <option :value="1">Tuesday</option>
            <option :value="2">Wednesday</option>
            <option :value="3">Thursday</option>
            <option :value="4">Friday</option>
            <option :value="5">Saturday</option>
            <option :value="6">Sunday</option>
          </select>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Start Time</label>
            <input v-model="availabilityForm.start_time" type="time" required
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
          </div>
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">End Time</label>
            <input v-model="availabilityForm.end_time" type="time" required
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
          </div>
        </div>
        
        <div>
          <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Timezone</label>
          <select v-model="availabilityForm.timezone"
            class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white text-sm focus:border-sc-blue focus:outline-none">
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Paris">Paris (CET)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
            <option value="Australia/Sydney">Sydney (AEST)</option>
          </select>
        </div>

        <div v-if="isEditMode">
          <input type="checkbox" id="is_active" v-model="availabilityForm.is_active" class="mr-2">
          <label for="is_active" class="text-white">Is Active</label>
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
            {{ isLoading ? 'Saving...' : (isEditMode ? 'Update Availability' : 'Set Availability') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, computed } from 'vue';
import { useCrewStore } from '../stores/crew';

const props = defineProps({
  show: Boolean,
  availabilitySlot: Object // Optional, for editing an existing slot
});

const emit = defineEmits(['close', 'availability-saved']);

const crewStore = useCrewStore();
const isLoading = ref(false);
const error = ref(null);

const defaultForm = {
  day_of_week: 0,
  start_time: '09:00',
  end_time: '17:00',
  timezone: 'UTC',
  is_active: true
};

const availabilityForm = ref({ ...defaultForm });

const isEditMode = computed(() => !!props.availabilitySlot);

watch(() => props.availabilitySlot, (newVal) => {
  if (newVal) {
    availabilityForm.value = { ...newVal };
  } else {
    resetForm();
  }
}, { immediate: true });

watch(() => props.show, (newVal) => {
  if (newVal && !isEditMode.value) {
    resetForm();
  }
});

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    let result;
    if (isEditMode.value) {
      result = await crewStore.updateAvailability(props.availabilitySlot.id, availabilityForm.value);
    } else {
      result = await crewStore.setAvailability(availabilityForm.value);
    }
    emit('availability-saved', result);
    emit('close');
    resetForm();
  } catch (err) {
    error.value = err.message || 'An unexpected error occurred.';
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  Object.assign(availabilityForm.value, defaultForm);
};
</script>

<style scoped>
/* Specific styles for AddEditAvailabilityModal */
</style>
