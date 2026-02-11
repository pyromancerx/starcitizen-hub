<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Announcements Management</h2>
      <button @click="showAddAnnouncementModal = true" class="px-4 py-2 bg-sc-blue text-sc-dark text-xs font-bold uppercase tracking-widest hover:bg-white transition-all">Add Announcement</button>
    </div>

    <div v-if="announcementStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden shadow-2xl">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-black/20 text-[10px] text-sc-grey/50 uppercase tracking-widest font-bold">
            <th class="p-4 border-b border-sc-grey/10">Title</th>
            <th class="p-4 border-b border-sc-grey/10">Content</th>
            <th class="p-4 border-b border-sc-grey/10">Starts</th>
            <th class="p-4 border-b border-sc-grey/10">Ends</th>
            <th class="p-4 border-b border-sc-grey/10 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          <tr v-if="announcementStore.announcements.length === 0">
            <td colspan="5" class="p-4 text-center text-sc-grey/50">No announcements found.</td>
          </tr>
          <tr v-for="announcement in announcementStore.announcements" :key="announcement.id" class="hover:bg-white/5 border-b border-sc-grey/5 transition-colors">
            <td class="p-4">
              <div class="font-bold text-white uppercase tracking-tight">{{ announcement.title }}</div>
            </td>
            <td class="p-4 text-sc-grey/70">{{ truncate(announcement.content, 100) }}</td>
            <td class="p-4 text-sc-grey/70">{{ formatDate(announcement.start_date) }}</td>
            <td class="p-4 text-sc-grey/70">{{ formatDate(announcement.end_date) }}</td>
            <td class="p-4 text-right">
              <button @click="openEditModal(announcement)" class="px-3 py-1 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-black uppercase tracking-widest rounded hover:bg-sc-blue hover:text-sc-dark transition-all mr-2">Edit</button>
              <button @click="handleDeleteAnnouncement(announcement.id)" class="px-3 py-1 bg-red-500/10 border border-red-500 text-red-500 text-[10px] font-black uppercase tracking-widest rounded hover:bg-red-500 hover:text-sc-dark transition-all">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AddAnnouncementModal 
      :show="showAddAnnouncementModal" 
      @close="showAddAnnouncementModal = false" 
      @announcement-added="announcementStore.fetchAnnouncements()" 
    />
    <EditAnnouncementModal
      :show="showEditAnnouncementModal"
      :announcement="editingAnnouncement"
      @close="showEditAnnouncementModal = false"
      @announcement-updated="announcementStore.fetchAnnouncements()"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAnnouncementStore } from '../stores/announcement'; // Import the store
import AddAnnouncementModal from '../components/AddAnnouncementModal.vue';
import EditAnnouncementModal from '../components/EditAnnouncementModal.vue';

const announcementStore = useAnnouncementStore(); // Use the store

const showAddAnnouncementModal = ref(false);
const showEditAnnouncementModal = ref(false);
const editingAnnouncement = ref(null);

const handleAddAnnouncement = () => {
  showAddAnnouncementModal.value = false;
  announcementStore.fetchAnnouncements();
};

const openEditModal = (announcement) => {
  editingAnnouncement.value = { ...announcement }; // Create a clone to avoid direct mutation
  showEditAnnouncementModal.value = true;
};

const handleDeleteAnnouncement = async (id) => {
  if (confirm('Are you sure you want to delete this announcement?')) {
    try {
      await announcementStore.deleteAnnouncement(id); // Use store action
      // fetchAnnouncements is already called by the store after deletion
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      // Optionally display an error message
    }
  }
};

const truncate = (text, length) => {
  return text.length > length ? text.substring(0, length) + '...' : text;
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

onMounted(() => {
  announcementStore.fetchAnnouncements(); // Fetch on mount
});
</script>
