<template>
  <div class="space-y-12">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Federation Peering</h2>
      <button class="px-4 py-2 bg-sc-blue text-sc-dark text-xs font-bold uppercase tracking-widest hover:bg-white transition-all">Establish Link</button>
    </div>

    <!-- Active Peers -->
    <section class="space-y-6">
      <h3 class="text-xs text-sc-grey/50 uppercase font-black tracking-widest flex items-center">
        <span class="mr-2 h-px w-8 bg-sc-blue/30"></span> Verified Peer Instances
      </h3>
      
      <div v-if="fedStore.isLoading && fedStore.peers.length === 0" class="flex justify-center p-8">
        <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sc-blue"></div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="peer in fedStore.peers" :key="peer.id" class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6 shadow-lg group hover:border-sc-blue/30 transition-all">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h4 class="text-lg font-bold text-white uppercase">{{ peer.name }}</h4>
              <div class="text-[10px] text-sc-grey/50 truncate w-48">{{ peer.base_url }}</div>
            </div>
            <span :class="{
              'bg-green-500/20 text-green-500 border-green-500/30': peer.status === 'active',
              'bg-yellow-500/20 text-yellow-500 border-yellow-500/30': peer.status === 'pending',
              'bg-red-500/20 text-red-500 border-red-500/30': peer.status === 'unreachable'
            }" class="px-2 py-0.5 rounded border text-[8px] font-bold uppercase tracking-widest">{{ peer.status }}</span>
          </div>
          
          <div class="mt-6 pt-4 border-t border-sc-grey/5 flex justify-between items-center">
            <div class="text-[8px] text-sc-grey/30 uppercase">Last Sync: {{ peer.last_seen_at ? new Date(peer.last_seen_at).toLocaleString() : 'Never' }}</div>
            <button class="text-[10px] text-sc-blue hover:underline uppercase font-bold tracking-widest">Settings</button>
          </div>
        </div>
        
        <div v-if="fedStore.peers.length === 0 && !fedStore.isLoading" class="col-span-full bg-sc-panel border border-sc-grey/10 border-dashed p-12 text-center rounded-lg">
          <p class="text-sc-grey/30 uppercase tracking-widest">Standalone mode active. No peer instances linked.</p>
        </div>
      </div>
    </section>

    <!-- Federated Events -->
    <section class="space-y-6">
      <h3 class="text-xs text-sc-grey/50 uppercase font-black tracking-widest flex items-center">
        <span class="mr-2 h-px w-8 bg-sc-blue/30"></span> Cross-Instance Intelligence
      </h3>
      
      <div class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden">
        <div class="bg-black/20 p-4 flex justify-between items-center text-[10px] text-sc-grey/50 font-black uppercase tracking-widest">
          <span>Synced Operation</span>
          <span>Source Instance</span>
        </div>
        <div class="divide-y divide-sc-grey/5">
          <div v-for="event in fedStore.federatedEvents" :key="event.id" class="p-4 flex justify-between items-center hover:bg-white/5 transition-colors group cursor-pointer" @click="window.open(event.source_url, '_blank')">
            <div>
              <div class="flex items-center space-x-2 mb-1">
                <span class="px-1.5 py-0.5 rounded bg-sc-blue/10 text-sc-blue text-[8px] font-bold uppercase">{{ event.event_type }}</span>
                <span class="text-[10px] text-sc-grey/50">{{ new Date(event.start_time).toLocaleString() }}</span>
              </div>
              <h4 class="text-sm font-bold text-white uppercase tracking-tight group-hover:text-sc-blue transition-colors">{{ event.title }}</h4>
            </div>
            <div class="text-right">
              <div class="text-xs font-bold text-sc-grey">{{ event.source_instance?.name || 'Remote Hub' }}</div>
              <div class="text-[8px] text-sc-grey/30 uppercase">Synced {{ new Date(event.created_at).toLocaleDateString() }}</div>
            </div>
          </div>
          
          <div v-if="fedStore.federatedEvents.length === 0" class="p-12 text-center text-sc-grey/20 italic uppercase tracking-widest">No federated data streams active.</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useFederationStore } from '../stores/federation';

const fedStore = useFederationStore();

onMounted(() => {
  fedStore.fetchPeers();
  fedStore.fetchFederatedEvents();
});
</script>
