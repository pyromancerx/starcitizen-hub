<template>
  <div class="space-y-6">
    <div class="flex items-center space-x-4 mb-8">
      <button @click="$router.push({ name: 'forum' })" class="text-sc-blue hover:text-white transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
      </button>
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Spectrum Channels</h2>
    </div>

    <div v-if="socialStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden shadow-xl">
      <div class="bg-black/20 p-4 flex justify-between items-center border-b border-sc-grey/10">
        <span class="text-[10px] text-sc-grey/50 uppercase tracking-widest font-bold">Topic</span>
        <div class="flex space-x-12 px-4">
          <span class="text-[10px] text-sc-grey/50 uppercase tracking-widest font-bold w-24 text-right">Activity</span>
        </div>
      </div>

      <div class="divide-y divide-sc-grey/5">
        <div v-for="thread in socialStore.threads" :key="thread.id" class="p-4 hover:bg-white/5 transition-colors cursor-pointer flex justify-between items-center group" @click="$router.push({ name: 'forum-thread', params: { id: thread.id } })">
          <div class="flex-1 min-w-0 pr-4">
            <div class="flex items-center space-x-2 mb-1">
              <span v-if="thread.is_pinned" class="px-1.5 py-0.5 rounded bg-sc-blue/20 text-sc-blue text-[8px] font-bold uppercase">Pinned</span>
              <span v-if="thread.is_locked" class="px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 text-[8px] font-bold uppercase">Locked</span>
            </div>
            <h4 class="text-white font-semibold text-lg group-hover:text-sc-blue transition-colors truncate">{{ thread.title }}</h4>
            <div class="text-[10px] text-sc-grey/50 uppercase mt-1">Transmitted by {{ thread.author?.display_name || 'Pilot' }}</div>
          </div>
          <div class="text-right w-32">
            <div class="text-xs text-sc-grey font-bold">{{ new Date(thread.updated_at).toLocaleDateString() }}</div>
            <div class="text-[10px] text-sc-grey/30 uppercase">{{ new Date(thread.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</div>
          </div>
        </div>
        
        <div v-if="socialStore.threads.length === 0 && !socialStore.isLoading" class="p-12 text-center text-sc-grey/30 italic uppercase tracking-tighter">
          Channel is empty. No transmissions active.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useSocialStore } from '../stores/social';

const route = useRoute();
const socialStore = useSocialStore();

onMounted(() => {
  socialStore.fetchThreads(route.params.id);
});
</script>
