<template>
  <div class="space-y-12">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Federation Peering</h2>
      <button @click="showCreatePeerModal = true" class="px-4 py-2 bg-sc-blue text-sc-dark text-xs font-bold uppercase tracking-widest hover:bg-white transition-all">Establish Link</button>
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
            <div class="flex items-center gap-2">
              <button @click="openEditPeerModal(peer)" class="text-[10px] text-sc-blue hover:underline uppercase font-bold tracking-widest">Edit</button>
              <button @click="handleDeletePeer(peer.id)" class="text-[10px] text-red-500 hover:underline uppercase font-bold tracking-widest">Delete</button>
            </div>
          </div>
        </div>
        
        <div v-if="fedStore.peers.length === 0 && !fedStore.isLoading" class="col-span-full bg-sc-panel border border-sc-grey/10 border-dashed p-12 text-center rounded-lg">
          <p class="text-sc-grey/30 uppercase tracking-widest">Standalone mode active. No peer instances linked.</p>
        </div>
      </div>
    </section>

    <!-- Federated Events -->
    <section class="space-y-6">
      <div class="flex justify-between items-center">
        <h3 class="text-xs text-sc-grey/50 uppercase font-black tracking-widest flex items-center">
          <span class="mr-2 h-px w-8 bg-sc-blue/30"></span> Cross-Instance Events
        </h3>
        <button @click="showCreateFederatedEventModal = true" class="px-3 py-1 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
          Add Event (Test)
        </button>
      </div>
      
      <div class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden">
        <div class="bg-black/20 p-4 flex justify-between items-center text-[10px] text-sc-grey/50 font-black uppercase tracking-widest">
          <span>Synced Operation</span>
          <span>Source Instance</span>
        </div>
        <div class="divide-y divide-sc-grey/5">
          <div v-for="event in fedStore.federatedEvents" :key="event.id" class="p-4 flex justify-between items-center hover:bg-white/5 transition-colors group">
            <div>
              <div class="flex items-center space-x-2 mb-1">
                <span class="px-1.5 py-0.5 rounded bg-sc-blue/10 text-sc-blue text-[8px] font-bold uppercase">{{ event.event_type }}</span>
                <span class="text-[10px] text-sc-grey/50">{{ new Date(event.start_time).toLocaleString() }}</span>
              </div>
              <h4 class="text-sm font-bold text-white uppercase tracking-tight group-hover:text-sc-blue transition-colors">
                <a :href="event.source_url" target="_blank" class="hover:underline">{{ event.title }}</a>
              </h4>
            </div>
            <div class="text-right flex items-center space-x-2">
              <div>
                <div class="text-xs font-bold text-sc-grey">{{ event.source_instance?.name || 'Remote Hub' }}</div>
                <div class="text-[8px] text-sc-grey/30 uppercase">Synced {{ new Date(event.created_at).toLocaleDateString() }}</div>
              </div>
              <button @click="openEditFederatedEventModal(event)" class="text-sc-grey/20 hover:text-sc-blue transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              </button>
              <button @click="handleDeleteFederatedEvent(event.id)" class="text-sc-grey/20 hover:text-red-500 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
          
          <div v-if="fedStore.federatedEvents.length === 0" class="p-12 text-center text-sc-grey/20 italic uppercase tracking-widest">No federated data streams active.</div>
        </div>
      </div>
    </section>

    <!-- Trade Requests -->
    <section class="space-y-6">
      <div class="flex justify-between items-center">
        <h3 class="text-xs text-sc-grey/50 uppercase font-black tracking-widest flex items-center">
          <span class="mr-2 h-px w-8 bg-sc-blue/30"></span> Cross-Instance Trade Requests
        </h3>
        <button @click="showCreateTradeRequestModal = true" class="px-3 py-1 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
          Add Request (Test)
        </button>
      </div>
      
      <div class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden">
        <div class="bg-black/20 p-4 flex justify-between items-center text-[10px] text-sc-grey/50 font-black uppercase tracking-widest">
          <span>Resource</span>
          <span>Source & Status</span>
        </div>
        <div class="divide-y divide-sc-grey/5">
          <div v-for="req in fedStore.tradeRequests" :key="req.id" class="p-4 flex justify-between items-center hover:bg-white/5 transition-colors group">
            <div>
              <div class="text-sm font-bold text-white uppercase tracking-tight">{{ req.amount.toLocaleString() }} {{ req.unit }} of {{ req.resource_type }}</div>
              <div class="text-[10px] text-sc-grey/50 mt-1">
                Price: {{ req.price_per_unit ? req.price_per_unit.toLocaleString() : 'N/A' }} aUEC/unit
              </div>
            </div>
            <div class="text-right flex items-center space-x-2">
              <div>
                <div class="text-xs font-bold text-sc-grey">{{ req.source_instance?.name || 'Remote Hub' }}</div>
                <span :class="{
                  'bg-green-500/20 text-green-500': req.status === 'fulfilled',
                  'bg-yellow-500/20 text-yellow-500': req.status === 'open',
                  'bg-red-500/20 text-red-500': req.status === 'cancelled'
                }" class="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest">{{ req.status }}</span>
              </div>
              <button @click="openEditTradeRequestModal(req)" class="text-sc-grey/20 hover:text-sc-blue transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
              </button>
              <button @click="handleDeleteTradeRequest(req.id)" class="text-sc-grey/20 hover:text-red-500 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
          
          <div v-if="fedStore.tradeRequests.length === 0" class="p-12 text-center text-sc-grey/20 italic uppercase tracking-widest">No cross-instance trade requests.</div>
        </div>
      </div>
    </section>
  </div>

  <CreatePeerModal :show="showCreatePeerModal" @close="showCreatePeerModal = false" @peer-created="fedStore.fetchPeers" />
  <EditPeerModal :show="showEditPeerModal" @close="showEditPeerModal = false" @peer-updated="fedStore.fetchPeers" :peer="editingPeer" />

  <CreateFederatedEventModal :show="showCreateFederatedEventModal" @close="showCreateFederatedEventModal = false" @event-created="fedStore.fetchFederatedEvents" />
  <EditFederatedEventModal :show="showEditFederatedEventModal" @close="showEditFederatedEventModal = false" @event-updated="fedStore.fetchFederatedEvents" :event="editingFederatedEvent" />

  <CreateTradeRequestModal :show="showCreateTradeRequestModal" @close="showCreateTradeRequestModal = false" @request-created="fedStore.fetchTradeRequests" />
  <EditTradeRequestModal :show="showEditTradeRequestModal" @close="showEditTradeRequestModal = false" @request-updated="fedStore.fetchTradeRequests" :request="editingTradeRequest" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useFederationStore } from '../stores/federation';
import CreatePeerModal from '../components/CreatePeerModal.vue';
import EditPeerModal from '../components/EditPeerModal.vue';
import CreateFederatedEventModal from '../components/CreateFederatedEventModal.vue';
import EditFederatedEventModal from '../components/EditFederatedEventModal.vue';
import CreateTradeRequestModal from '../components/CreateTradeRequestModal.vue';
import EditTradeRequestModal from '../components/EditTradeRequestModal.vue';

const fedStore = useFederationStore();

const showCreatePeerModal = ref(false);
const showEditPeerModal = ref(false);
const editingPeer = ref(null);

const showCreateFederatedEventModal = ref(false);
const showEditFederatedEventModal = ref(false);
const editingFederatedEvent = ref(null);

const showCreateTradeRequestModal = ref(false);
const showEditTradeRequestModal = ref(false);
const editingTradeRequest = ref(null);


onMounted(() => {
  fedStore.fetchPeers();
  fedStore.fetchFederatedEvents();
  fedStore.fetchTradeRequests();
});

// --- Peer Handlers ---
const handleCreatePeer = async (peerData) => {
  try {
    await fedStore.createPeer(peerData);
    showCreatePeerModal.value = false;
  } catch (error) {
    alert(error.message || 'Failed to establish peer link.');
  }
};
const openEditPeerModal = (peer) => {
  editingPeer.value = { ...peer };
  showEditPeerModal.value = true;
};
const handleUpdatePeer = async (updatedPeerData) => {
  try {
    await fedStore.updatePeer(editingPeer.value.id, updatedPeerData);
    showEditPeerModal.value = false;
  } catch (error) {
    alert(error.message || 'Failed to update peer.');
  }
};
const handleDeletePeer = async (peerId) => {
  if (confirm('Are you sure you want to delete this peer link? This cannot be undone.')) {
    try {
      await fedStore.deletePeer(peerId);
    } catch (error) {
      alert(error.message || 'Failed to delete peer.');
    }
  }
};

// --- Federated Event Handlers ---
const handleCreateFederatedEvent = async (eventData) => {
  try {
    await fedStore.createFederatedEvent(eventData.peer_id, eventData);
    showCreateFederatedEventModal.value = false;
  } catch (error) {
    alert(error.message || 'Failed to create federated event.');
  }
};
const openEditFederatedEventModal = (event) => {
  editingFederatedEvent.value = { ...event };
  showEditFederatedEventModal.value = true;
};
const handleUpdateFederatedEvent = async (updatedEventData) => {
  try {
    await fedStore.updateFederatedEvent(editingFederatedEvent.value.id, updatedEventData);
    showEditFederatedEventModal.value = false;
  } catch (error) {
    alert(error.message || 'Failed to update federated event.');
  }
};
const handleDeleteFederatedEvent = async (eventId) => {
  if (confirm('Are you sure you want to delete this federated event? This cannot be undone.')) {
    try {
      await fedStore.deleteFederatedEvent(eventId);
    } catch (error) {
      alert(error.message || 'Failed to delete federated event.');
    }
  }
};

// --- Trade Request Handlers ---
const handleCreateTradeRequest = async (requestData) => {
  try {
    await fedStore.createTradeRequest(requestData.peer_id, requestData);
    showCreateTradeRequestModal.value = false;
  } catch (error) {
    alert(error.message || 'Failed to create trade request.');
  }
};
const openEditTradeRequestModal = (request) => {
  editingTradeRequest.value = { ...request };
  showEditTradeRequestModal.value = true;
};
const handleUpdateTradeRequest = async (updatedRequestData) => {
  try {
    await fedStore.updateTradeRequest(editingTradeRequest.value.id, updatedRequestData);
    showEditTradeRequestModal.value = false;
  } catch (error) {
    alert(error.message || 'Failed to update trade request.');
  }
};
const handleDeleteTradeRequest = async (requestId) => {
  if (confirm('Are you sure you want to delete this trade request? This cannot be undone.')) {
    try {
      await fedStore.deleteTradeRequest(requestId);
    } catch (error) {
      alert(error.message || 'Failed to delete trade request.');
    }
  }
};
</script>
