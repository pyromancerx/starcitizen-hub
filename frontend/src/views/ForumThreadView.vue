<template>
  <div v-if="socialStore.isLoading && !socialStore.currentThread" class="flex justify-center p-12">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
  </div>

  <div v-else-if="socialStore.currentThread" class="space-y-6">
    <div class="flex items-center space-x-4 mb-4">
      <button @click="$router.push({ name: 'forum-category', params: { id: socialStore.currentThread.category_id } })" class="text-sc-blue hover:text-white transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
      </button>
      <h2 class="text-xl font-bold text-white tracking-wide uppercase italic truncate">{{ socialStore.currentThread.title }}</h2>
    </div>

    <!-- Posts List -->
    <div class="space-y-4">
      <div v-for="post in socialStore.currentThread.posts" :key="post.id" class="bg-sc-panel border border-sc-grey/10 rounded-lg flex flex-col md:flex-row overflow-hidden shadow-lg">
        <!-- User Info Sidebar -->
        <div class="w-full md:w-48 bg-black/20 p-6 flex md:flex-col items-center md:items-start space-x-4 md:space-x-0 md:space-y-4 border-b md:border-b-0 md:border-r border-sc-grey/5">
          <div class="h-16 w-16 rounded bg-sc-panel border border-sc-blue/20 flex items-center justify-center text-sc-blue text-2xl font-bold">
            {{ post.author?.display_name?.charAt(0) || 'P' }}
          </div>
          <div>
            <div class="text-sm font-bold text-sc-blue truncate w-32">{{ post.author?.display_name || 'Anonymous' }}</div>
            <div class="text-[8px] text-sc-grey/50 uppercase font-black tracking-widest mt-1">Personnel</div>
          </div>
        </div>
        
        <!-- Post Content -->
        <div class="flex-1 p-8 flex flex-col">
          <div class="text-sc-grey leading-relaxed flex-1 whitespace-pre-line text-sm">{{ post.content }}</div>
          <div class="mt-8 pt-4 border-t border-sc-grey/5 flex justify-between items-center">
            <div class="text-[10px] text-sc-grey/30 uppercase tracking-tighter">Transmission Received: {{ new Date(post.created_at).toLocaleString() }}</div>
            <div class="flex space-x-4">
              <button class="text-[10px] text-sc-grey/50 hover:text-sc-blue uppercase font-bold tracking-widest transition-colors">Quote</button>
              <button class="text-[10px] text-sc-grey/50 hover:text-sc-blue uppercase font-bold tracking-widest transition-colors">Report</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reply Box -->
    <div v-if="!socialStore.currentThread.is_locked" class="bg-sc-panel border border-sc-grey/10 rounded-lg p-8 shadow-2xl">
      <h3 class="text-xs text-sc-grey/50 uppercase font-black tracking-widest mb-4 flex items-center">
        <span class="mr-2 h-px w-8 bg-sc-blue/30"></span> New Transmission
      </h3>
      <textarea 
        rows="4" 
        class="w-full bg-black/30 border border-sc-grey/20 rounded p-4 text-white text-sm focus:outline-none focus:border-sc-blue/50 transition-colors"
        placeholder="Enter response data..."
      ></textarea>
      <div class="mt-4 flex justify-end">
        <button class="px-8 py-3 bg-sc-blue/10 border border-sc-blue text-sc-blue font-bold uppercase tracking-widest text-xs rounded hover:bg-sc-blue hover:text-sc-dark transition-all duration-300">Transmit Reply</button>
      </div>
    </div>
    
    <div v-else class="bg-red-900/10 border border-red-500/20 rounded p-6 text-center">
      <p class="text-red-500/70 text-xs font-bold uppercase tracking-widest">This channel has been locked. No further transmissions permitted.</p>
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
  socialStore.fetchThreadDetail(route.params.id);
});
</script>
