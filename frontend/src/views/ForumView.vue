<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Spectrum Forum</h2>
    </div>

    <div v-if="socialStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div class="grid grid-cols-1 gap-4">
      <div v-for="category in socialStore.categories" :key="category.id" class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6 hover:border-sc-blue/30 transition-all group cursor-pointer shadow-lg" @click="$router.push({ name: 'forum-category', params: { id: category.id } })">
        <div class="flex justify-between items-center">
          <div class="space-y-1">
            <h3 class="text-xl font-bold text-white uppercase tracking-tight group-hover:text-sc-blue transition-colors">{{ category.name }}</h3>
            <p class="text-xs text-sc-grey/70">{{ category.description || 'No description available.' }}</p>
          </div>
          <div class="text-right">
            <svg class="w-6 h-6 text-sc-grey/20 group-hover:text-sc-blue transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </div>
        </div>
      </div>
      
      <div v-if="socialStore.categories.length === 0 && !socialStore.isLoading" class="bg-sc-panel border border-sc-grey/10 p-12 text-center">
        <p class="text-sc-grey/50 uppercase tracking-widest italic">The frequencies are quiet. No forum categories found.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useSocialStore } from '../stores/social';

const socialStore = useSocialStore();

onMounted(() => {
  socialStore.fetchCategories();
});
</script>
