<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="2xl font-bold text-white tracking-wide uppercase italic">Spectrum Forum</h2>
      <button @click="showAddCategoryModal = true" class="px-4 py-2 bg-sc-blue text-sc-dark text-xs font-bold uppercase tracking-widest hover:bg-white transition-all">Create Category</button>
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

  <AddForumCategoryModal :show="showAddCategoryModal" @close="showAddCategoryModal = false" @add-category="handleAddCategory" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useSocialStore } from '../stores/social';
import AddForumCategoryModal from '../components/AddForumCategoryModal.vue';

const socialStore = useSocialStore();
const showAddCategoryModal = ref(false);

onMounted(() => {
  socialStore.fetchCategories();
});

const handleAddCategory = async (newCategoryData) => {
  await socialStore.addCategory(newCategoryData);
  showAddCategoryModal.value = false;
};
</script>
