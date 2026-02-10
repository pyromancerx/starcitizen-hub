<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-sc-dark p-6 rounded-lg shadow-lg w-full max-w-md border border-sc-grey/20">
      <h3 class="text-xl font-bold text-white mb-4">Schedule New Event</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="title" class="block text-sc-grey text-sm font-bold mb-2">Event Title</label>
          <input type="text" id="title" v-model="newEvent.title"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="description" class="block text-sc-grey text-sm font-bold mb-2">Description (Optional)</label>
          <textarea id="description" v-model="newEvent.description" rows="3"
                    class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue"></textarea>
        </div>
        <div>
          <label for="startTime" class="block text-sc-grey text-sm font-bold mb-2">Start Time</label>
          <input type="datetime-local" id="startTime" v-model="newEvent.start_time"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="endTime" class="block text-sc-grey text-sm font-bold mb-2">End Time (Optional)</label>
          <input type="datetime-local" id="endTime" v-model="newEvent.end_time"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
        </div>
        <div>
          <label for="location" class="block text-sc-grey text-sm font-bold mb-2">Location (Optional)</label>
          <input type="text" id="location" v-model="newEvent.location"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
        </div>
        <div>
          <label for="eventType" class="block text-sc-grey text-sm font-bold mb-2">Event Type</label>
          <select id="eventType" v-model="newEvent.event_type"
                  class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required>
            <option value="Mission">Mission</option>
            <option value="Training">Training</option>
            <option value="Social">Social</option>
            <option value="Exploration">Exploration</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label for="maxParticipants" class="block text-sc-grey text-sm font-bold mb-2">Max Participants (Optional)</label>
          <input type="number" id="maxParticipants" v-model.number="newEvent.max_participants"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" min="1" />
        </div>
        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            Schedule
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

const emit = defineEmits(['close', 'add-event']);

const newEvent = ref({
  title: '',
  description: '',
  start_time: '',
  end_time: '',
  location: '',
  event_type: 'Mission',
  max_participants: null
});

const handleSubmit = () => {
  // Convert datetime-local strings to ISO strings if needed by backend, or let Pydantic handle it
  const eventData = { ...newEvent.value };
  if (eventData.start_time) eventData.start_time = new Date(eventData.start_time).toISOString();
  if (eventData.end_time) eventData.end_time = new Date(eventData.end_time).toISOString();

  emit('add-event', eventData);
  // Reset form after submission
  newEvent.value = {
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    event_type: 'Mission',
    max_participants: null
  };
};
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
