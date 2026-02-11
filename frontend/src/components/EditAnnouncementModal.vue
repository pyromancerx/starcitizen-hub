<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-sc-dark p-6 rounded-lg shadow-lg w-full max-w-md border border-sc-grey/20">
      <h3 class="text-xl font-bold text-white mb-4">Edit Announcement</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="edit-title" class="block text-sc-grey text-sm font-bold mb-2">Title</label>
          <input type="text" id="edit-title" v-model="editingAnnouncement.title"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="edit-content" class="block text-sc-grey text-sm font-bold mb-2">Content</label>
          <textarea id="edit-content" v-model="editingAnnouncement.content" rows="5"
                    class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required></textarea>
        </div>
        <div>
          <label for="edit-start_date" class="block text-sc-grey text-sm font-bold mb-2">Start Date</label>
          <input type="datetime-local" id="edit-start_date" v-model="editingAnnouncement.start_date"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="edit-end_date" class="block text-sc-grey text-sm font-bold mb-2">End Date (Optional)</label>
          <input type="datetime-local" id="edit-end_date" v-model="editingAnnouncement.end_date"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
        </div>
        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            Update Announcement
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';
import AnnouncementsService from '../services/AnnouncementsService';

const props = defineProps({
  show: Boolean,
  announcement: Object // The announcement object to be edited
});

const emit = defineEmits(['close', 'announcement-updated']);

// Local ref for editing, initialized from prop
const editingAnnouncement = ref({
  id: null,
  title: '',
  content: '',
  start_date: '',
  end_date: ''
});

// Watch for changes in the 'announcement' prop and update local state
watch(() => props.announcement, (newVal) => {
  if (newVal) {
    editingAnnouncement.value = { ...newVal };
    // Format dates for datetime-local input
    if (editingAnnouncement.value.start_date) {
      editingAnnouncement.value.start_date = new Date(editingAnnouncement.value.start_date).toISOString().slice(0, 16);
    }
    if (editingAnnouncement.value.end_date) {
      editingAnnouncement.value.end_date = new Date(editingAnnouncement.value.end_date).toISOString().slice(0, 16);
    } else {
      editingAnnouncement.value.end_date = ''; // Ensure it's empty if null
    }
  }
}, { immediate: true }); // immediate: true to run handler on initial render

const handleSubmit = async () => {
  try {
    const announcementData = { ...editingAnnouncement.value };
    // Convert datetime-local strings back to ISO strings
    if (announcementData.start_date) announcementData.start_date = new Date(announcementData.start_date).toISOString();
    if (announcementData.end_date) announcementData.end_date = new Date(announcementData.end_date).toISOString();

    await AnnouncementsService.updateAnnouncement(editingAnnouncement.value.id, announcementData);
    emit('announcement-updated');
    emit('close');
  } catch (error) {
    console.error('Failed to update announcement:', error);
    alert('Failed to update announcement. Please check your input and try again.');
  }
};
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
