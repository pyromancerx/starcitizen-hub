<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Cargo Contracts</h2>
      <button @click="showAddEditContractModal = true" class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all">
        Post Contract
      </button>
    </div>

    <!-- Hauler Stats -->
    <div v-if="tradeStore.haulerStats" class="bg-sc-panel border border-sc-blue/20 rounded-lg p-4">
      <h3 class="text-sm font-bold text-sc-blue uppercase tracking-widest mb-3">My Hauling Stats</h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <div class="text-xs text-sc-grey/50 uppercase">Contracts Completed</div>
          <div class="text-xl font-bold text-white">{{ tradeStore.haulerStats.contracts_completed }}</div>
        </div>
        <div>
          <div class="text-xs text-sc-grey/50 uppercase">Total Earnings</div>
          <div class="text-xl font-bold text-green-400">{{ formatAUEC(tradeStore.haulerStats.total_earnings) }}</div>
        </div>
        <div>
          <div class="text-xs text-sc-grey/50 uppercase">Volume Hauled</div>
          <div class="text-xl font-bold text-sc-light-blue">{{ tradeStore.haulerStats.total_volume_hauled }} SCU</div>
        </div>
        <div>
          <div class="text-xs text-sc-grey/50 uppercase">Reputation</div>
          <div class="text-xl font-bold text-sc-blue">{{ tradeStore.haulerStats.reputation_score }}</div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-sc-grey/20">
      <button 
        @click="activeTab = 'open'" 
        :class="activeTab === 'open' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey'"
        class="px-6 py-3 border-b-2 text-xs uppercase tracking-widest font-bold transition-colors">
        Open Contracts
      </button>
      <button 
        @click="activeTab = 'my'" 
        :class="activeTab === 'my' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey'"
        class="px-6 py-3 border-b-2 text-xs uppercase tracking-widest font-bold transition-colors">
        My Contracts
      </button>
      <button 
        @click="activeTab = 'hauling'" 
        :class="activeTab === 'hauling' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey'"
        class="px-6 py-3 border-b-2 text-xs uppercase tracking-widest font-bold transition-colors">
        Hauling
      </button>
    </div>

    <div v-if="tradeStore.isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else>
      <!-- Open Contracts -->
      <div v-if="activeTab === 'open'" class="space-y-4">
        <div v-if="tradeStore.contracts.length === 0" class="bg-sc-panel border border-sc-grey/10 p-12 text-center">
          <p class="text-sc-grey uppercase tracking-widest">No open contracts available.</p>
          <p class="text-sc-grey/50 text-sm mt-2">Check back later or post your own contract!</p>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="contract in tradeStore.contracts" :key="contract.id" 
            class="bg-sc-panel border border-sc-grey/10 rounded-lg p-4 hover:border-sc-blue/30 transition-all">
            <div class="flex justify-between items-start mb-3">
              <span class="text-xs text-green-400 uppercase tracking-widest font-bold">{{ contract.status }}</span>
              <span class="text-lg font-bold text-green-400">{{ formatAUEC(contract.payment_amount) }}</span>
            </div>
            
            <div class="space-y-2 mb-4">
              <div class="flex items-center gap-2">
                <span class="text-sc-grey text-xs uppercase w-20">Route:</span>
                <span class="text-white text-sm">{{ contract.origin }} → {{ contract.destination }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sc-grey text-xs uppercase w-20">Cargo:</span>
                <span class="text-white text-sm">{{ contract.quantity }} SCU {{ contract.commodity }}</span>
              </div>
              <div v-if="contract.deadline" class="flex items-center gap-2">
                <span class="text-sc-grey text-xs uppercase w-20">Deadline:</span>
                <span class="text-white text-sm">{{ formatDate(contract.deadline) }}</span>
              </div>
            </div>
            
            <button @click="acceptContract(contract.id)" 
              class="w-full py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue hover:bg-sc-blue/20 transition-all text-xs uppercase tracking-widest">
              Accept Contract
            </button>
          </div>
        </div>
      </div>

      <!-- My Posted Contracts -->
      <div v-if="activeTab === 'my'" class="space-y-4">
        <div v-if="tradeStore.myContracts.length === 0" class="bg-sc-panel border border-sc-grey/10 p-12 text-center">
          <p class="text-sc-grey uppercase tracking-widest">You haven't posted any contracts.</p>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="contract in tradeStore.myContracts" :key="contract.id" 
            class="bg-sc-panel border border-sc-grey/10 rounded-lg p-4">
            <div class="flex justify-between items-start mb-3">
              <span :class="getStatusClass(contract.status)" class="text-xs uppercase tracking-widest font-bold">
                {{ contract.status }}
              </span>
              <span class="text-lg font-bold text-green-400">{{ formatAUEC(contract.payment_amount) }}</span>
            </div>
            
            <div class="space-y-2 mb-4">
              <div class="flex items-center gap-2">
                <span class="text-sc-grey text-xs uppercase w-20">Route:</span>
                <span class="text-white text-sm">{{ contract.origin }} → {{ contract.destination }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sc-grey text-xs uppercase w-20">Cargo:</span>
                <span class="text-white text-sm">{{ contract.quantity }} SCU {{ contract.commodity }}</span>
              </div>
            </div>
            
            <div class="flex gap-2">
              <button v-if="contract.status === 'open'" @click="cancelContract(contract.id)"
                class="flex-1 py-2 border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-all text-xs uppercase tracking-widest">
                Cancel
              </button>
              <button v-if="contract.status === 'in_progress'" @click="completeContract(contract.id)"
                class="flex-1 py-2 bg-green-500/10 border border-green-500 text-green-500 hover:bg-green-500/20 transition-all text-xs uppercase tracking-widest">
                Complete
              </button>
              <button v-if="['accepted', 'in_progress'].includes(contract.status)" @click="disputeContract(contract.id)"
                class="flex-1 py-2 border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 transition-all text-xs uppercase tracking-widest">
                Dispute
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- My Hauling Contracts -->
      <div v-if="activeTab === 'hauling'" class="space-y-4">
        <div v-if="tradeStore.myHaulingContracts.length === 0" class="bg-sc-panel border border-sc-grey/10 p-12 text-center">
          <p class="text-sc-grey uppercase tracking-widest">You haven't accepted any hauling contracts.</p>
        </div>
        
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="contract in tradeStore.myHaulingContracts" :key="contract.id" 
            class="bg-sc-panel border border-sc-blue/20 rounded-lg p-4">
            <div class="flex justify-between items-start mb-3">
              <span :class="getStatusClass(contract.status)" class="text-xs uppercase tracking-widest font-bold">
                {{ contract.status }}
              </span>
              <span class="text-lg font-bold text-green-400">{{ formatAUEC(contract.payment_amount) }}</span>
            </div>
            
            <div class="space-y-2 mb-4">
              <div class="flex items-center gap-2">
                <span class="text-sc-grey text-xs uppercase w-20">Route:</span>
                <span class="text-white text-sm">{{ contract.origin }} → {{ contract.destination }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sc-grey text-xs uppercase w-20">Cargo:</span>
                <span class="text-white text-sm">{{ contract.quantity }} SCU {{ contract.commodity }}</span>
              </div>
            </div>
            
            <div class="flex gap-2">
              <button v-if="contract.status === 'accepted'" @click="startContract(contract.id)"
                class="flex-1 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue hover:bg-sc-blue/20 transition-all text-xs uppercase tracking-widest">
                Start Delivery
              </button>
              <button v-if="contract.status === 'in_progress'" @click="completeContract(contract.id)"
                class="flex-1 py-2 bg-green-500/10 border border-green-500 text-green-500 hover:bg-green-500/20 transition-all text-xs uppercase tracking-widest">
                Mark Complete
              </button>
              <button v-if="['accepted', 'in_progress'].includes(contract.status)" @click="cancelContract(contract.id)"
                class="px-3 py-2 border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-all text-xs uppercase tracking-widest">
                Cancel
              </button>
              <button v-if="['accepted', 'in_progress'].includes(contract.status) || contract.status === 'completed'" @click="disputeContract(contract.id)"
                class="flex-1 py-2 border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 transition-all text-xs uppercase tracking-widest">
                Dispute
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AddEditCargoContractModal
      :show="showAddEditContractModal"
      @close="showAddEditContractModal = false"
      @contract-saved="handleContractSaved"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTradeStore } from '../stores/trade';
import AddEditCargoContractModal from '../components/AddEditCargoContractModal.vue';

const tradeStore = useTradeStore();
const showAddEditContractModal = ref(false);
const activeTab = ref('open');

onMounted(() => {
  tradeStore.fetchOpenContracts();
  tradeStore.fetchMyContracts();
  tradeStore.fetchMyHaulingContracts();
  tradeStore.fetchHaulerStats();
});

const formatAUEC = (amount) => {
  if (amount === null || amount === undefined) return '0 aUEC';
  return new Intl.NumberFormat('en-US').format(amount) + ' aUEC';
};

const formatDate = (dateString) => {
  if (!dateString) return 'No deadline';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusClass = (status) => {
  switch (status) {
    case 'open': return 'text-green-400';
    case 'accepted': return 'text-yellow-500';
    case 'in_progress': return 'text-sc-blue';
    case 'completed': return 'text-green-400';
    case 'cancelled': return 'text-red-500';
    case 'disputed': return 'text-orange-500';
    default: return 'text-sc-grey';
  }
};

const handleContractSaved = () => {
  showAddEditContractModal.value = false;
  // Refresh relevant lists based on active tab or all
  tradeStore.fetchOpenContracts();
  tradeStore.fetchMyContracts();
  tradeStore.fetchMyHaulingContracts();
};

const acceptContract = async (contractId) => {
  try {
    await tradeStore.acceptContract(contractId);
    await tradeStore.fetchOpenContracts();
    await tradeStore.fetchMyHaulingContracts();
  } catch (e) {
    // Error handled in store
  }
};

const startContract = async (contractId) => {
  try {
    await tradeStore.startContract(contractId);
    await tradeStore.fetchMyHaulingContracts();
  } catch (e) {
    // Error handled in store
  }
};

const completeContract = async (contractId) => {
  try {
    await tradeStore.completeContract(contractId);
    await tradeStore.fetchMyContracts();
    await tradeStore.fetchMyHaulingContracts();
    await tradeStore.fetchHaulerStats();
  } catch (e) {
    // Error handled in store
  }
};

const cancelContract = async (contractId) => {
  if (confirm('Are you sure you want to cancel this contract?')) {
    try {
      await tradeStore.cancelContract(contractId);
      await tradeStore.fetchMyContracts();
      await tradeStore.fetchMyHaulingContracts();
      await tradeStore.fetchOpenContracts();
    } catch (e) {
      // Error handled in store
    }
  }
};

const disputeContract = async (contractId) => {
  if (confirm('Are you sure you want to dispute this contract? This will flag it for admin review.')) {
    try {
      await tradeStore.disputeContract(contractId);
      alert('Contract disputed successfully! An admin will review it shortly.');
      // Refresh relevant lists
      tradeStore.fetchMyContracts();
      tradeStore.fetchMyHaulingContracts();
    } catch (e) {
      console.error('Failed to dispute contract:', e);
      alert('Failed to dispute contract.');
    }
  }
};
</script>
