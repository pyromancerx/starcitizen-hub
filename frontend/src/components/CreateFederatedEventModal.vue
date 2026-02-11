<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-sc-dark p-6 rounded-lg shadow-lg w-full max-w-md border border-sc-grey/20">
      <h3 class="text-xl font-bold text-white mb-4">Create Federated Event</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="peerId" class="block text-sc-grey text-sm font-bold mb-2">Source Peer</label>
          <select id="peerId" v-model="eventData.peer_id"
                  class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required>
            <option v-for="peer in fedStore.peers" :key="peer.id" :value="peer.id">{{ peer.name }}</option>
          </select>
        </div>
        <div>
          <label for="remoteEventId" class="block text-sc-grey text-sm font-bold mb-2">Remote Event ID</label>
          <input type="number" id="remoteEventId" v-model.number="eventData.remote_event_id"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="title" class="block text-sc-grey text-sm font-bold mb-2">Title</label>
          <input type="text" id="title" v-model="eventData.title"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="description" class="block text-sc-grey text-sm font-bold mb-2">Description</label>
          <textarea id="description" v-model="eventData.description" rows="3"
                    class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue"></textarea>
        </div>
        <div>
          <label for="startTime" class="block text-sc-grey text-sm font-bold mb-2">Start Time</label>
          <input type="datetime-local" id="startTime" v-model="eventData.start_time"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="eventType" class="block text-sc-grey text-sm font-bold mb-2">Event Type</label>
          <input type="text" id="eventType" v-model="eventData.event_type"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="sourceUrl" class="block text-sc-grey text-sm font-bold mb-2">Source URL</label>
          <input type="url" id="sourceUrl" v-model="eventData.source_url"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        
        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            Create Event
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import { useFederationStore } from '../stores/federation';

const props = defineProps({
  show: Boolean,
});

const emit = defineEmits(['close', 'event-created']);

const fedStore = useFederationStore();

const eventData = ref({
  peer_id: null, // This will be the source_instance_id
  remote_event_id: null,
  title: '',
  description: '',
  start_time: '',
  event_type: '',
  source_url: '',
});

const handleSubmit = async () => {
  try {
    // Convert datetime-local to ISO string
    const isoStartTime = eventData.value.start_time ? new Date(eventData.value.start_time).toISOString() : '';
    await fedStore.createFederatedEvent(eventData.value.peer_id, {
      ...eventData.value,
      start_time: isoStartTime,
    });
    emit('event-created');
    emit('close');
    // Reset form
    eventData.value = {
      peer_id: null,
      remote_event_id: null,
      title: '',
      description: '',
      start_time: '',
      event_type: '',
      source_url: '',
    };
  } catch (error) {
    alert(error.message || 'Failed to create federated event.');
  }
};
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
