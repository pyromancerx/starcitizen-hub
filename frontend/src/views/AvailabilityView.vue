<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Availability & Sessions</h2>
      <button @click="showAddEditAvailabilityModal = true; editingAvailabilitySlot = null" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
        Set Availability
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-sc-grey/20">
      <button 
        @click="activeTab = 'my'" 
        :class="activeTab === 'my' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey'"
        class="px-6 py-3 border-b-2 text-xs uppercase tracking-widest font-bold transition-colors">
        My Availability
      </button>
      <button 
        @click="activeTab = 'overlaps'" 
        :class="activeTab === 'overlaps' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey'"
        class="px-6 py-3 border-b-2 text-xs uppercase tracking-widest font-bold transition-colors">
        Overlaps
      </button>
      <button 
        @click="activeTab = 'suggestions'" 
        :class="activeTab === 'suggestions' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey'"
        class="px-6 py-3 border-b-2 text-xs uppercase tracking-widest font-bold transition-colors">
        Session Suggestions
      </button>
    </div>

    <div v-if="crewStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else>
      <!-- My Availability -->
      <div v-if="activeTab === 'my'" class="space-y-4">
        <div v-if="crewStore.availability.length === 0" class="bg-sc-panel border border-sc-grey/10 p-12 text-center">
          <p class="text-sc-grey uppercase tracking-widest">No availability set.</p>
          <p class="text-sc-grey/50 text-sm mt-2">Set your weekly availability to find play sessions!</p>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="slot in sortedAvailability" :key="slot.id" 
            class="bg-sc-panel border border-sc-grey/10 rounded-lg p-4">
            <div class="flex justify-between items-start mb-3">
              <span class="text-lg font-bold text-sc-blue">{{ dayNames[slot.day_of_week] }}</span>
              <div class="flex gap-2">
                <button @click="openEditAvailabilityModal(slot)" class="text-yellow-500 hover:text-yellow-400 text-xs uppercase">
                  Edit
                </button>
                <button @click="deleteAvailability(slot.id)" class="text-red-500 hover:text-red-400 text-xs uppercase">
                  Remove
                </button>
              </div>
            </div>
            
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-sc-grey text-xs uppercase w-16">Time:</span>
                <span class="text-white">{{ slot.start_time }} - {{ slot.end_time }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sc-grey text-xs uppercase w-16">Timezone:</span>
                <span class="text-white">{{ slot.timezone }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Availability Overlaps -->
      <div v-if="activeTab === 'overlaps'" class="space-y-4">
        <div v-if="crewStore.availabilityOverlaps.length === 0" class="bg-sc-panel border border-sc-grey/10 p-12 text-center">
          <p class="text-sc-grey uppercase tracking-widest">No availability overlaps found.</p>
          <p class="text-sc-grey/50 text-sm mt-2">Set your availability and check back to see overlaps with other members!</p>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="overlap in crewStore.availabilityOverlaps" :key="overlap.user_id + overlap.day_of_week" 
            class="bg-sc-panel border border-sc-blue/20 rounded-lg p-4">
            <div class="mb-3">
              <div class="text-lg font-bold text-white">{{ overlap.display_name }}</div>
              <div class="text-sm text-sc-blue">{{ overlap.day_name }}</div>
            </div>
            
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-sc-grey text-xs uppercase w-20">Overlap:</span>
                <span class="text-green-400 font-bold">{{ overlap.overlap_start }} - {{ overlap.overlap_end }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sc-grey text-xs uppercase w-20">Duration:</span>
                <span class="text-white">{{ Math.floor(overlap.overlap_minutes / 60) }}h {{ overlap.overlap_minutes % 60 }}m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Session Suggestions -->
      <div v-if="activeTab === 'suggestions'" class="space-y-4">
        <div class="flex gap-4 mb-4">
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Min Participants</label>
            <input v-model.number="suggestionParams.min_participants" type="number" min="2" max="10"
              class="bg-sc-panel border border-sc-grey/30 rounded px-3 py-2 text-white text-sm w-32">
          </div>
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Min Duration (min)</label>
            <input v-model.number="suggestionParams.min_duration" type="number" min="30" max="240" step="30"
              class="bg-sc-panel border border-sc-grey/30 rounded px-3 py-2 text-white text-sm w-32">
          </div>
          <div class="flex items-end">
            <button @click="fetchSuggestions" 
              class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
              Refresh
            </button>
          </div>
        </div>

        <div v-if="crewStore.sessionSuggestions.length === 0" class="bg-sc-panel border border-sc-grey/10 p-12 text-center">
          <p class="text-sc-grey uppercase tracking-widest">No session suggestions found.</p>
          <p class="text-sc-grey/50 text-sm mt-2">Try adjusting your filters or set more availability!</p>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="(suggestion, idx) in crewStore.sessionSuggestions" :key="idx" 
            class="bg-sc-panel border border-sc-blue/20 rounded-lg p-4">
            <div class="mb-3">
              <div class="text-lg font-bold text-white">{{ suggestion.day_name }}</div>
              <div class="text-sm text-sc-blue">{{ suggestion.start_time }} - {{ suggestion.end_time }}</div>
            </div>
            
            <div class="space-y-2 mb-4">
              <div class="flex items-center gap-2">
                <span class="text-sc-grey text-xs uppercase w-24">Duration:</span>
                <span class="text-white">{{ Math.floor(suggestion.duration_minutes / 60) }}h {{ suggestion.duration_minutes % 60 }}m</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sc-grey text-xs uppercase w-24">Participants:</span>
                <span class="text-green-400 font-bold">{{ suggestion.participant_count }}</span>
              </div>
            </div>

            <div class="border-t border-sc-grey/10 pt-3">
              <div class="text-xs text-sc-grey/50 uppercase tracking-widest mb-2">Available Members</div>
              <div class="flex flex-wrap gap-1">
                <span v-for="user in suggestion.available_users" :key="user.user_id" 
                  class="text-[10px] bg-sc-blue/10 text-sc-blue px-2 py-1 rounded">
                  {{ user.display_name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AddEditAvailabilityModal
      :show="showAddEditAvailabilityModal"
      :availability-slot="editingAvailabilitySlot"
      @close="showAddEditAvailabilityModal = false"
      @availability-saved="handleAvailabilitySaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCrewStore } from '../stores/crew';
import AddEditAvailabilityModal from '../components/AddEditAvailabilityModal.vue';

const crewStore = useCrewStore();
const activeTab = ref('my');

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const showAddEditAvailabilityModal = ref(false);
const editingAvailabilitySlot = ref(null);

const suggestionParams = ref({
  min_participants: 2,
  min_duration: 60
});

onMounted(() => {
  crewStore.fetchMyAvailability();
  crewStore.fetchAvailabilityOverlaps();
  crewStore.fetchSessionSuggestions(suggestionParams.value);
});

const sortedAvailability = computed(() => {
  return [...crewStore.availability].sort((a, b) => a.day_of_week - b.day_of_week);
});

const openEditAvailabilityModal = (slot) => {
  editingAvailabilitySlot.value = { ...slot };
  showAddEditAvailabilityModal.value = true;
};

const deleteAvailability = async (id) => {
  if (confirm('Are you sure you want to remove this availability slot?')) {
    try {
      await crewStore.deleteAvailability(id);
      alert('Availability slot removed successfully!');
      crewStore.fetchMyAvailability(); // Refresh list
    } catch (e) {
      console.error('Failed to remove availability slot:', e);
      alert('Failed to remove availability slot.');
    }
  }
};

const handleAvailabilitySaved = () => {
  showAddEditAvailabilityModal.value = false;
  editingAvailabilitySlot.value = null; // Clear editing state
  crewStore.fetchMyAvailability();
  crewStore.fetchAvailabilityOverlaps();
  crewStore.fetchSessionSuggestions(suggestionParams.value);
};

const fetchSuggestions = () => {
  crewStore.fetchSessionSuggestions(suggestionParams.value);
};
</script>

<style scoped>
/* Specific styles for AvailabilityView */
</style>