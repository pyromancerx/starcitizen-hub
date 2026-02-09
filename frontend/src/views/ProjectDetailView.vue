<template>
  <div v-if="projectStore.isLoading && !projectStore.currentProject" class="flex justify-center p-12">
    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
  </div>

  <div v-else-if="projectStore.currentProject" class="space-y-8">
    <div class="flex items-center space-x-4">
      <button @click="$router.push({ name: 'projects' })" class="text-sc-blue hover:text-white transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
      </button>
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">{{ projectStore.currentProject.title }}</h2>
    </div>

    <!-- Project Meta -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="lg:col-span-3 space-y-8">
        <!-- Phases and Tasks -->
        <div class="space-y-6">
          <h3 class="text-xs text-sc-grey/50 uppercase font-black tracking-widest flex items-center">
            <span class="mr-2 h-px w-8 bg-sc-blue/30"></span> Operational Phases
          </h3>
          
          <div v-for="phase in projectStore.currentProject.phases" :key="phase.id" class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden shadow-lg">
            <div class="bg-black/20 p-4 border-b border-sc-grey/10 flex justify-between items-center">
              <h4 class="text-sm font-bold text-white uppercase">{{ phase.name }}</h4>
              <span class="text-[10px] text-sc-grey/50 uppercase">{{ phase.tasks?.length || 0 }} Objectives</span>
            </div>
            <div class="divide-y divide-sc-grey/5">
              <div v-for="task in phase.tasks" :key="task.id" class="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                <div class="flex items-center space-x-4">
                  <div :class="{
                    'bg-green-500/20 text-green-500 border-green-500/30': task.status === 'done',
                    'bg-sc-blue/20 text-sc-blue border-sc-blue/30': task.status === 'in_progress',
                    'bg-sc-grey/10 text-sc-grey/50 border-sc-grey/20': task.status === 'todo'
                  }" class="h-5 w-5 rounded border flex items-center justify-center">
                    <svg v-if="task.status === 'done'" class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
                  </div>
                  <span :class="task.status === 'done' ? 'text-sc-grey/30 line-through' : 'text-white'" class="text-sm font-semibold transition-all">{{ task.title }}</span>
                </div>
                <div class="flex items-center space-x-4">
                  <span v-if="task.assignee" class="text-[10px] text-sc-blue/70 uppercase font-bold tracking-tighter">{{ task.assignee.display_name }}</span>
                  <button class="text-sc-grey/20 group-hover:text-sc-blue transition-colors">
                    <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                  </button>
                </div>
              </div>
              <div v-if="phase.tasks?.length === 0" class="p-8 text-center text-sc-grey/20 text-xs italic uppercase tracking-widest">No objectives defined for this phase.</div>
            </div>
          </div>
          
          <div v-if="projectStore.currentProject.phases?.length === 0" class="bg-sc-panel border border-sc-grey/10 border-dashed p-12 text-center rounded-lg">
            <p class="text-sc-grey/30 uppercase tracking-widest text-sm">No phases initialized.</p>
          </div>
        </div>
      </div>

      <!-- Sidebar Info -->
      <div class="space-y-6">
        <!-- Contribution Goals -->
        <div class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6 space-y-6">
          <h3 class="text-xs text-sc-grey font-black uppercase tracking-widest mb-4">Contribution Goals</h3>
          
          <div v-for="goal in projectStore.currentProject.contribution_goals" :key="goal.id" class="space-y-2">
            <div class="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
              <span class="text-sc-blue">{{ goal.resource_type }}</span>
              <span class="text-white">{{ goal.current_amount.toLocaleString() }} / {{ goal.target_amount.toLocaleString() }}</span>
            </div>
            <div class="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
              <div class="bg-sc-blue h-full transition-all duration-1000 shadow-[0_0_10px_rgba(102,252,241,0.5)]" :style="{ width: Math.min((goal.current_amount / goal.target_amount) * 100, 100) + '%' }"></div>
            </div>
            <button class="w-full mt-2 py-2 bg-white/5 hover:bg-sc-blue/10 text-[8px] text-sc-blue font-bold uppercase tracking-widest border border-sc-blue/20 rounded transition-all">Contribute</button>
          </div>
          
          <div v-if="projectStore.currentProject.contribution_goals?.length === 0" class="text-center py-4 text-sc-grey/30 text-[10px] italic uppercase tracking-widest">No active funding goals.</div>
        </div>

        <!-- Manager Info -->
        <div class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6">
          <h3 class="text-xs text-sc-grey font-black uppercase tracking-widest mb-4">Command</h3>
          <div class="flex items-center space-x-4">
            <div class="h-10 w-10 rounded-full bg-sc-grey/10 border border-sc-blue/30 flex items-center justify-center text-sc-blue text-xs font-black">
              {{ projectStore.currentProject.manager?.display_name?.charAt(0) || 'M' }}
            </div>
            <div>
              <div class="text-sm font-bold text-white">{{ projectStore.currentProject.manager?.display_name || 'Project Manager' }}</div>
              <div class="text-[8px] text-sc-grey/50 uppercase font-black tracking-widest">Operations Director</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useProjectStore } from '../stores/project';

const route = useRoute();
const projectStore = useProjectStore();

onMounted(() => {
  projectStore.fetchProjectDetail(route.params.id);
});
</script>
