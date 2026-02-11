<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Latest Announcements</h2>

    <div v-if="announcementStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else-if="announcementStore.publicAnnouncements.length === 0" class="bg-sc-panel border border-sc-grey/10 rounded-lg p-12 text-center text-sc-grey/50">
      No public announcements available at the moment.
    </div>

    <div v-else class="space-y-4">
      <div v-for="announcement in announcementStore.publicAnnouncements" :key="announcement.id" 
        class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6 shadow-md"
      >
        <h3 class="text-xl font-bold text-white uppercase tracking-tight">{{ announcement.title }}</h3>
        <p class="text-sc-grey mt-2">{{ announcement.content }}</p>
        <div class="text-sm text-sc-grey/70 mt-4 border-t border-sc-grey/10 pt-4 flex justify-between">
          <span>Posted: {{ formatDate(announcement.created_at) }}</span>
          <span v-if="announcement.end_date">Expires: {{ formatDate(announcement.end_date) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAnnouncementStore } from '../stores/announcement';

const announcementStore = useAnnouncementStore();

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

onMounted(() => {
  announcementStore.fetchPublicAnnouncements();
});
</script>