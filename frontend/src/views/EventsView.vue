<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Upcoming Operations</h2>
      <button class="px-4 py-2 bg-sc-blue text-sc-dark text-xs font-bold uppercase tracking-widest hover:bg-white transition-all">Schedule Event</button>
    </div>

    <div v-if="eventStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div class="space-y-4">
      <div v-for="event in eventStore.events" :key="event.id" class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6 flex flex-col md:flex-row justify-between items-center hover:border-sc-blue/30 transition-all group">
        <div class="flex items-center space-x-6 w-full">
          <!-- Date Badge -->
          <div class="flex-shrink-0 w-16 h-16 bg-sc-dark border border-sc-blue/20 rounded flex flex-col items-center justify-center">
            <div class="text-[10px] text-sc-blue font-bold uppercase">{{ new Date(event.start_time).toLocaleString('default', { month: 'short' }) }}</div>
            <div class="text-2xl font-bold text-white">{{ new Date(event.start_time).getDate() }}</div>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-1">
              <span class="px-2 py-0.5 rounded bg-sc-blue/10 text-[10px] text-sc-blue font-bold uppercase tracking-tighter">{{ event.event_type }}</span>
              <span class="text-xs text-sc-grey/50">Scheduled for {{ new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
            </div>
            <h3 class="text-lg font-bold text-white uppercase tracking-tight truncate">{{ event.title }}</h3>
            <p class="text-xs text-sc-grey/70 truncate">{{ event.location || 'Deep Space' }} • Organized by {{ event.organizer?.display_name || 'Anonymous' }}</p>
          </div>
        </div>

        <div class="mt-4 md:mt-0 md:ml-6 flex items-center space-x-4">
          <div class="text-right hidden sm:block">
            <div class="text-xs text-sc-grey/50 uppercase font-bold tracking-widest">Signups</div>
            <div class="text-sm font-bold text-white">0 / {{ event.max_participants || '∞' }}</div>
          </div>
          <router-link :to="{ name: 'event-detail', params: { id: event.id } }" class="px-6 py-2 border border-sc-blue/50 text-sc-blue text-[10px] font-bold uppercase tracking-widest rounded hover:bg-sc-blue hover:text-sc-dark transition-all">Mission Intel</router-link>
        </div>
      </div>

      <div v-if="eventStore.events.length === 0" class="bg-sc-panel border border-sc-grey/10 p-12 text-center">
        <p class="text-sc-grey/50 uppercase tracking-widest">The operation log is clear. No upcoming events.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useEventStore } from '../stores/social';

const eventStore = useEventStore();

onMounted(() => {
  eventStore.fetchEvents();
});
</script>
