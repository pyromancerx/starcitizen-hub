<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-sc-dark p-6 rounded-lg shadow-lg w-full max-w-md border border-sc-grey/20">
      <h3 class="text-xl font-bold text-white mb-4">Create New Announcement</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="title" class="block text-sc-grey text-sm font-bold mb-2">Title</label>
          <input type="text" id="title" v-model="newAnnouncement.title"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="content" class="block text-sc-grey text-sm font-bold mb-2">Content</label>
          <textarea id="content" v-model="newAnnouncement.content" rows="5"
                    class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required></textarea>
        </div>
        <div>
          <label for="start_date" class="block text-sc-grey text-sm font-bold mb-2">Start Date</label>
          <input type="datetime-local" id="start_date" v-model="newAnnouncement.start_date"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="end_date" class="block text-sc-grey text-sm font-bold mb-2">End Date (Optional)</label>
          <input type="datetime-local" id="end_date" v-model="newAnnouncement.end_date"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
        </div>
        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            Add Announcement
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import AnnouncementsService from '../services/AnnouncementsService';

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['close', 'announcement-added']);

const newAnnouncement = ref({
  title: '',
  content: '',
  start_date: '',
  end_date: ''
});

const handleSubmit = async () => {
  try {
    // Convert datetime-local strings to ISO strings
    const announcementData = { ...newAnnouncement.value };
    if (announcementData.start_date) announcementData.start_date = new Date(announcementData.start_date).toISOString();
    if (announcementData.end_date) announcementData.end_date = new Date(announcementData.end_date).toISOString();

    await AnnouncementsService.createAnnouncement(announcementData);
    emit('announcement-added');
    emit('close');
    // Reset form
    newAnnouncement.value = {
      title: '',
      content: '',
      start_date: '',
      end_date: ''
    };
  } catch (error) {
    console.error('Failed to create announcement:', error);
    alert('Failed to create announcement. Please check your input and try again.');
  }
};
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
