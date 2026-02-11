<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-bold text-white uppercase tracking-widest mb-4">Loadout Templates</h3>
      
      <div v-if="crewStore.loadoutTemplates.length === 0" class="text-center py-8">
        <p class="text-sc-grey">No templates available.</p>
      </div>
      
      <div v-else class="space-y-3">
        <div v-for="template in crewStore.loadoutTemplates" :key="template.id" 
          class="bg-black/20 rounded p-3">
          <div class="flex justify-between items-start mb-2">
            <div class="font-bold text-white">{{ template.name }}</div>
            <button @click="useTemplate(template)" 
              class="px-3 py-1 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
              Use Template
            </button>
          </div>
          <div class="text-xs text-sc-grey">
            {{ template.positions.length }} positions • by {{ template.creator_name || 'Unknown' }}
          </div>
          <div v-if="template.ship_name" class="text-xs text-sc-grey mt-1">
            Ship: {{ template.ship_name }}
          </div>
          <div class="flex flex-wrap gap-1 mt-2">
            <span v-for="(pos, idx) in template.positions" :key="idx"
              class="text-[10px] bg-sc-grey/10 text-sc-grey px-2 py-1 rounded">
              {{ pos.role }}
            </span>
          </div>
        </div>
      </div>
      
      <div class="mt-6 flex justify-end">
        <button type="button" @click="$emit('close')"
          class="px-4 py-2 border border-sc-grey/30 text-sc-grey hover:text-white hover:border-sc-grey transition-all text-xs uppercase tracking-widest">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, onMounted } from 'vue';
import { useCrewStore } from '../stores/crew';

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['close', 'use-template']);

const crewStore = useCrewStore();

onMounted(() => {
  crewStore.fetchLoadoutTemplates(); // Ensure templates are fetched
});

const useTemplate = (template) => {
  emit('use-template', template);
};
</script>

<style scoped>
/* Specific styles for CrewLoadoutTemplatesModal */
</style>
