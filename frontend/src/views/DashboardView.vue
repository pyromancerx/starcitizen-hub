<template>
  <div class="space-y-8">
    <div class="flex justify-between items-center">
      <h2 class="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center">
        <span class="mr-3 h-8 w-1.5 bg-sc-blue shadow-[0_0_15px_rgba(102,252,241,0.5)]"></span>
        Command Center
      </h2>
      <div class="text-[10px] font-bold text-sc-blue uppercase tracking-[0.3em] bg-sc-blue/5 px-4 py-2 border border-sc-blue/20 rounded">System Sync Active</div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Fleet Readiness -->
      <div class="bg-sc-panel border border-sc-blue/10 rounded-lg p-6 relative overflow-hidden group hover:border-sc-blue/40 transition-all cursor-pointer shadow-lg" @click="$router.push('/fleet')">
        <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
          <svg class="w-20 h-20 fill-current text-sc-blue" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
        </div>
        <div class="relative z-10">
          <h3 class="text-sc-grey/50 text-[10px] uppercase font-black tracking-widest mb-1">Fleet Readiness</h3>
          <div class="text-4xl font-black text-white tracking-tighter">85%</div>
          <div class="mt-4 flex items-center justify-between">
            <span class="text-[10px] text-green-400 font-bold uppercase tracking-tighter flex items-center">
              <svg class="w-3 h-3 mr-1 fill-current" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5H7z"></path></svg>
              Combat Ready
            </span>
            <span class="text-[10px] text-sc-grey/30 font-bold uppercase underline group-hover:text-sc-blue">Vessel Registry</span>
          </div>
        </div>
      </div>

      <!-- Active Operations -->
      <div class="bg-sc-panel border border-sc-blue/10 rounded-lg p-6 relative overflow-hidden group hover:border-sc-blue/40 transition-all cursor-pointer shadow-lg" @click="$router.push('/events')">
         <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
          <svg class="w-20 h-20 fill-current text-sc-blue" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"></path></svg>
        </div>
        <div class="relative z-10">
          <h3 class="text-sc-grey/50 text-[10px] uppercase font-black tracking-widest mb-1">Active Ops</h3>
          <div class="text-4xl font-black text-white tracking-tighter">03</div>
          <div class="mt-4 flex items-center justify-between">
            <span class="text-[10px] text-sc-blue font-bold uppercase tracking-tighter">Next: Recon Mission</span>
            <span class="text-[10px] text-sc-grey/30 font-bold uppercase underline group-hover:text-sc-blue">Mission Board</span>
          </div>
        </div>
      </div>

      <!-- Org Treasury -->
      <div class="bg-sc-panel border border-sc-blue/10 rounded-lg p-6 relative overflow-hidden group hover:border-sc-blue/40 transition-all cursor-pointer shadow-lg" @click="$router.push('/wallet')">
         <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
          <svg class="w-20 h-20 fill-current text-sc-blue" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-5 14H9v-2h6v2zm-3-7c-1.38 0-2.5-1.12-2.5-2.5S10.62 6 12 6s2.5 1.12 2.5 2.5S13.38 11 12 11z"></path></svg>
        </div>
        <div class="relative z-10">
          <h3 class="text-sc-grey/50 text-[10px] uppercase font-black tracking-widest mb-1">Org Treasury</h3>
          <div class="text-4xl font-black text-white tracking-tighter">12.5M <span class="text-lg font-bold text-sc-blue/50">aUEC</span></div>
          <div class="mt-4 flex items-center justify-between">
            <span class="text-[10px] text-red-400 font-bold uppercase tracking-tighter">Requisition pending</span>
            <span class="text-[10px] text-sc-grey/30 font-bold uppercase underline group-hover:text-sc-blue">Ledger</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Comms Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Recent Announcements -->
      <div class="bg-sc-panel border border-sc-grey/10 rounded-lg flex flex-col shadow-xl">
        <div class="p-6 border-b border-sc-grey/10 flex justify-between items-center">
          <h3 class="text-sm font-black text-white uppercase tracking-[0.2em]">Urgent Transmissions</h3>
          <router-link to="/announcements" class="text-[8px] text-sc-blue font-bold uppercase hover:underline">View All</router-link>
        </div>
        <div class="flex-1 p-2 space-y-1">
          <div v-if="announcements.length === 0" class="p-8 text-center text-sc-grey/20 text-xs uppercase tracking-widest italic">No urgent signals.</div>
          <div v-for="ann in announcements" :key="ann.id" class="p-4 hover:bg-white/5 rounded transition-all cursor-pointer group">
            <div class="flex items-center space-x-4">
              <div class="h-1 w-8 bg-sc-blue shadow-[0_0_10px_rgba(102,252,241,0.5)]"></div>
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-bold text-white uppercase truncate group-hover:text-sc-blue transition-colors">{{ ann.title }}</h4>
                <div class="text-[10px] text-sc-grey/40 uppercase font-bold mt-1">{{ new Date(ann.created_at).toLocaleDateString() }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pending Tasks -->
      <div class="bg-sc-panel border border-sc-grey/10 rounded-lg flex flex-col shadow-xl">
        <div class="p-6 border-b border-sc-grey/10 flex justify-between items-center">
          <h3 class="text-sm font-black text-white uppercase tracking-[0.2em]">Assigned Objectives</h3>
          <router-link to="/projects" class="text-[8px] text-sc-blue font-bold uppercase hover:underline">Logistics Board</router-link>
        </div>
        <div class="flex-1 p-6 text-center flex flex-col items-center justify-center space-y-4">
          <div class="h-12 w-12 rounded-full border-2 border-sc-grey/10 flex items-center justify-center text-sc-grey/20">
            <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"></path></svg>
          </div>
          <p class="text-xs text-sc-grey/30 uppercase tracking-widest font-bold">No active combat assignments found.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const announcements = ref([]);

onMounted(async () => {
  try {
    const res = await api.get('/announcements/');
    announcements.value = res.data.slice(0, 3);
  } catch (e) {
    // Ignore fail for now
  }
});
</script>