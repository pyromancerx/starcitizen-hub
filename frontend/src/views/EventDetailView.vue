<template>
  <div v-if="eventStore.isLoading && !eventStore.currentEvent" class="flex justify-center p-12">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
  </div>

  <div v-else-if="eventStore.currentEvent" class="space-y-8">
    <!-- Hero Header -->
    <div class="relative bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden shadow-2xl">
      <div class="h-48 bg-gradient-to-r from-sc-light-blue/20 to-sc-dark flex items-end p-8">
        <div class="relative z-10">
          <div class="flex items-center space-x-3 mb-2">
            <span class="px-3 py-1 rounded bg-sc-blue text-sc-dark text-[10px] font-black uppercase tracking-widest">{{ eventStore.currentEvent.event_type }}</span>
            <span class="text-sc-blue/70 text-xs font-bold uppercase tracking-widest">{{ eventStore.currentEvent.status }}</span>
          </div>
          <h1 class="text-4xl font-bold text-white uppercase tracking-tighter">{{ eventStore.currentEvent.title }}</h1>
        </div>
      </div>
      
      <div class="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="md:col-span-2 space-y-6">
          <div>
            <h3 class="text-xs text-sc-grey/50 uppercase font-black tracking-widest mb-4 flex items-center">
              <span class="mr-2 h-px w-8 bg-sc-blue/30"></span> Mission Briefing
            </h3>
            <div class="text-sc-grey leading-relaxed whitespace-pre-line">{{ eventStore.currentEvent.description || 'No detailed briefing available for this operation.' }}</div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-black/20 border border-sc-grey/10 rounded p-6 space-y-4">
            <div class="flex justify-between items-center text-xs">
              <span class="text-sc-grey/50 uppercase">Deployment</span>
              <span class="text-white font-bold">{{ new Date(eventStore.currentEvent.start_time).toLocaleString() }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-sc-grey/50 uppercase">Location</span>
              <span class="text-sc-blue font-bold">{{ eventStore.currentEvent.location || 'Deep Space' }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-sc-grey/50 uppercase">Personnel</span>
              <span class="text-white font-bold">{{ eventStore.currentEvent.signups?.length || 0 }} / {{ eventStore.currentEvent.max_participants || '∞' }}</span>
            </div>
            <div class="pt-4 mt-2 border-t border-sc-grey/5">
              <button 
                @click="showSignupModal = true"
                class="w-full py-3 bg-sc-blue text-sc-dark font-black uppercase tracking-widest text-xs rounded hover:bg-white transition-all shadow-[0_0_15px_rgba(102,252,241,0.2)]"
              >
                Sign Up for Op
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Personnel Manifest -->
    <div class="bg-sc-panel border border-sc-grey/10 rounded-lg p-8">
      <h3 class="text-xs text-sc-grey/50 uppercase font-black tracking-widest mb-6 flex items-center">
        <span class="mr-2 h-px w-8 bg-sc-blue/30"></span> Personnel Manifest
      </h3>
      
      <div v-if="eventStore.currentEvent.signups?.length === 0" class="text-center py-12 text-sc-grey/30 italic">
        No personnel assigned to this operation yet.
      </div>
      
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="signup in eventStore.currentEvent.signups" :key="signup.id" class="flex items-center space-x-4 p-4 bg-black/20 border border-sc-grey/5 rounded group hover:border-sc-blue/20 transition-all">
          <div class="h-10 w-10 rounded-full bg-sc-grey/10 border border-sc-grey/20 flex items-center justify-center text-sc-blue font-bold text-xs">
            {{ signup.user?.display_name?.charAt(0) || '?' }}
          </div>
          <div>
            <div class="text-sm font-bold text-white">{{ signup.user?.display_name || 'Unknown Pilot' }}</div>
            <div class="text-[10px] text-sc-blue font-bold uppercase tracking-widest opacity-70">{{ signup.role || 'Personnel' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <EventSignupModal :show="showSignupModal" @close="showSignupModal = false" @signup="handleSignup" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useEventStore } from '../stores/social';
import EventSignupModal from '../components/EventSignupModal.vue'; // NEW

const route = useRoute();
const eventStore = useEventStore();
const showSignupModal = ref(false);

onMounted(() => {
  eventStore.fetchEvent(route.params.id);
});

const handleSignup = async (signupData) => {
  try {
    await eventStore.signup(eventStore.currentEvent.id, signupData.role);
    showSignupModal.value = false;
  } catch (err) {
    // Error handling is done in the store action
    alert(err.message || 'Failed to sign up for event');
  }
};
</script>
