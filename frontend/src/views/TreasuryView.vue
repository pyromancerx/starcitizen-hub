<template>
  <div class="treasury-view space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Org Treasury</h2>
      <button 
        v-if="isAdmin"
        @click="showCreateWalletModal = true"
        class="px-4 py-2 bg-sc-blue hover:bg-sc-light-blue text-sc-dark font-bold uppercase tracking-widest text-xs rounded transition-all"
      >
        Create Wallet
      </button>
    </div>

    <!-- Wallet Selector & Balance -->
    <div class="bg-gradient-to-r from-sc-panel to-sc-dark border border-sc-blue/30 rounded-lg p-6 shadow-[0_0_20px_rgba(102,252,241,0.1)]">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <!-- Wallet Selector -->
        <div class="flex-1">
          <label class="text-xs text-sc-blue font-bold uppercase tracking-widest mb-2 block">Select Wallet</label>
          <div class="flex items-center gap-3">
            <select 
              v-model="selectedWalletId"
              @change="handleWalletChange"
              class="bg-sc-dark border border-sc-grey/30 rounded-lg px-4 py-2 text-white focus:border-sc-blue focus:outline-none min-w-[200px]"
            >
              <option v-for="wallet in treasuryStore.wallets" :key="wallet.id" :value="wallet.id">
                {{ wallet.name }} {{ wallet.is_primary ? '(Primary)' : '' }}
              </option>
            </select>
            <button 
              v-if="isAdmin && treasuryStore.selectedWallet"
              @click="showEditWalletModal = true"
              class="p-2 text-sc-grey hover:text-white transition-colors"
              title="Edit Wallet"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button 
              v-if="isAdmin && treasuryStore.selectedWallet && !treasuryStore.selectedWallet.is_primary"
              @click="handleDeleteWallet"
              class="p-2 text-red-500 hover:text-red-400 transition-colors"
              title="Delete Wallet"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
          <p v-if="treasuryStore.selectedWallet?.description" class="text-sm text-sc-grey mt-2">
            {{ treasuryStore.selectedWallet.description }}
          </p>
        </div>

        <!-- Balance Display -->
        <div class="text-right">
          <div class="text-xs text-sc-blue font-bold uppercase tracking-widest mb-1">Current Balance</div>
          <div class="text-5xl font-mono font-bold text-white flex items-baseline">
            {{ formatAmount(treasuryStore.selectedWallet?.balance || 0) }}
            <span class="text-xl ml-2 text-sc-blue/70">aUEC</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex gap-4 mt-6 pt-6 border-t border-sc-grey/10">
        <button 
          @click="showCreateDepositModal = true"
          class="flex-1 px-6 py-3 bg-green-600/20 border border-green-500/50 text-green-400 hover:bg-green-600/30 font-bold uppercase tracking-widest text-sm rounded transition-all flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
          </svg>
          Deposit
        </button>
        <button 
          @click="showCreateWithdrawalModal = true"
          class="flex-1 px-6 py-3 bg-red-600/20 border border-red-500/50 text-red-400 hover:bg-red-600/30 font-bold uppercase tracking-widest text-sm rounded transition-all flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
          </svg>
          Withdraw
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-sc-grey/20">
      <div class="flex gap-6">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'pb-3 text-sm font-bold uppercase tracking-widest transition-colors relative',
            activeTab === tab.id ? 'text-sc-blue' : 'text-sc-grey hover:text-white'
          ]"
        >
          {{ tab.label }}
          <span 
            v-if="tab.id === 'pending' && treasuryStore.pendingCount > 0"
            class="ml-2 bg-yellow-500 text-black text-[10px] px-1.5 rounded-full"
          >
            {{ treasuryStore.pendingCount }}
          </span>
          <div 
            v-if="activeTab === tab.id"
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-sc-blue"
          />
        </button>
      </div>
    </div>

    <!-- Transactions Tab -->
    <div v-if="activeTab === 'transactions'" class="space-y-4">
      <!-- Filters -->
      <div class="flex flex-wrap gap-3">
        <select v-model="filters.type" @change="applyFilters" class="bg-sc-panel border border-sc-grey/30 rounded px-3 py-2 text-sm text-white">
          <option value="">All Types</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">Withdrawals</option>
        </select>
        <select v-model="filters.status" @change="applyFilters" class="bg-sc-panel border border-sc-grey/30 rounded px-3 py-2 text-sm text-white">
          <option value="">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <select v-model="filters.category" @change="applyFilters" class="bg-sc-panel border border-sc-grey/30 rounded px-3 py-2 text-sm text-white">
          <option value="">All Categories</option>
          <option value="operation_payout">Operation Payout</option>
          <option value="stockpile_purchase">Stockpile Purchase</option>
          <option value="donation">Donation</option>
          <option value="tax">Tax</option>
          <option value="other">Other</option>
        </select>
      </div>

      <!-- Transaction List -->
      <div class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden">
        <div v-if="treasuryStore.isLoading" class="p-12 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sc-blue mx-auto"></div>
        </div>
        <div v-else-if="filteredTransactions.length === 0" class="p-12 text-center text-sc-grey/50 italic uppercase tracking-tighter">
          No transactions found.
        </div>
        <div v-else class="divide-y divide-sc-grey/5">
          <div 
            v-for="tx in filteredTransactions" 
            :key="tx.id" 
            class="p-4 hover:bg-white/5 transition-colors"
          >
            <div class="flex justify-between items-start">
              <div class="flex items-start gap-4">
                <!-- Type Icon -->
                <div 
                  :class="[
                    'h-10 w-10 rounded flex items-center justify-center font-bold',
                    tx.type === 'deposit' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                  ]"
                >
                  {{ tx.type === 'deposit' ? '+' : '-' }}
                </div>
                <div>
                  <div class="text-sm font-semibold text-white">{{ tx.description || formatCategory(tx.category) }}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span 
                      :class="[
                        'text-[10px] px-2 py-0.5 rounded uppercase',
                        tx.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      ]"
                    >
                      {{ tx.status }}
                    </span>
                    <span class="text-[10px] text-sc-grey/50">{{ formatDate(tx.created_at) }}</span>
                  </div>
                </div>
              </div>
              <div 
                :class="[
                  'font-mono font-bold text-lg',
                  tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                ]"
              >
                {{ formatAmount(tx.amount) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reports Tab -->
    <div v-else-if="activeTab === 'reports'" class="space-y-6">
      <!-- Period Selector -->
      <div class="flex gap-2">
        <button 
          v-for="days in [30, 90, 365]" 
          :key="days"
          @click="reportPeriod = days; fetchReport()"
          :class="[
            'px-4 py-2 rounded text-sm font-bold uppercase tracking-widest transition-colors',
            reportPeriod === days ? 'bg-sc-blue text-sc-dark' : 'bg-sc-panel text-sc-grey hover:text-white'
          ]"
        >
          {{ days }} Days
        </button>
      </div>

      <!-- Report Content -->
      <div v-if="treasuryStore.report" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Summary Cards -->
        <div class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6">
          <div class="text-[10px] text-sc-grey/50 uppercase tracking-widest mb-2">Total Income</div>
          <div class="text-2xl font-mono font-bold text-green-400">+{{ formatAmount(treasuryStore.report.total_income) }}</div>
        </div>
        <div class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6">
          <div class="text-[10px] text-sc-grey/50 uppercase tracking-widest mb-2">Total Expenses</div>
          <div class="text-2xl font-mono font-bold text-red-400">-{{ formatAmount(treasuryStore.report.total_expenses) }}</div>
        </div>
        <div class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6">
          <div class="text-[10px] text-sc-grey/50 uppercase tracking-widest mb-2">Net Change</div>
          <div 
            :class="[
              'text-2xl font-mono font-bold',
              treasuryStore.report.net_change >= 0 ? 'text-green-400' : 'text-red-400'
            ]"
          >
            {{ treasuryStore.report.net_change >= 0 ? '+' : '' }}{{ formatAmount(treasuryStore.report.net_change) }}
          </div>
        </div>

        <!-- Category Breakdown -->
        <div class="md:col-span-3 bg-sc-panel border border-sc-grey/10 rounded-lg p-6">
          <h3 class="text-sm font-bold text-white uppercase tracking-widest mb-4">Category Breakdown</h3>
          <div v-if="Object.keys(treasuryStore.report.by_category).length === 0" class="text-sc-grey/50 text-center py-8">
            No data for this period
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              v-for="(data, category) in treasuryStore.report.by_category" 
              :key="category"
              class="bg-sc-dark/50 rounded-lg p-4"
            >
              <div class="text-xs text-sc-grey uppercase mb-2">{{ formatCategory(category) }}</div>
              <div class="flex justify-between items-center">
                <span class="text-green-400 font-mono text-sm">+{{ formatAmount(data.income) }}</span>
                <span class="text-red-400 font-mono text-sm">-{{ formatAmount(data.expenses) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-12 text-sc-grey/50">
        Loading report...
      </div>
    </div>

    <!-- Pending Tab (Admin Only) -->
    <div v-else-if="activeTab === 'pending'" class="space-y-4">
      <div v-if="!isAdmin" class="text-center py-12 text-sc-grey">
        Admin access required
      </div>
      <div v-else-if="treasuryStore.pendingTransactions.length === 0" class="text-center py-12 text-sc-grey/50">
        No pending transactions
      </div>
      <div v-else class="space-y-4">
        <div 
          v-for="tx in treasuryStore.pendingTransactions" 
          :key="tx.id"
          class="bg-sc-panel border border-yellow-500/30 rounded-lg p-4"
        >
          <div class="flex justify-between items-start">
            <div>
              <div class="text-sm font-semibold text-white">{{ tx.description || formatCategory(tx.category) }}</div>
              <div class="text-xs text-sc-grey mt-1">
                Wallet: {{ getWalletName(tx.treasury_id) }} • 
                Requested by: Citizen #{{ tx.user_id }} • 
                {{ formatDate(tx.created_at) }}
              </div>
            </div>
            <div class="text-xl font-mono font-bold text-red-400">
              -{{ formatAmount(tx.amount) }}
            </div>
          </div>
          <div class="flex gap-3 mt-4">
            <button 
              @click="approveTransaction(tx.id)"
              class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold uppercase tracking-widest text-xs transition-colors"
            >
              Approve
            </button>
            <button 
              @click="rejectTransaction(tx.id)"
              class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold uppercase tracking-widest text-xs transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>

    <CreateDepositModal
      :show="showCreateDepositModal"
      :wallet-id="treasuryStore.selectedWallet?.id"
      @close="showCreateDepositModal = false"
      @transaction-completed="handleTransactionCompleted"
    />

    <CreateWithdrawalModal
      :show="showCreateWithdrawalModal"
      :wallet-id="treasuryStore.selectedWallet?.id"
      :wallet-balance="treasuryStore.selectedWallet?.balance"
      @close="showCreateWithdrawalModal = false"
      @transaction-completed="handleTransactionCompleted"
    />

    <!-- Create Wallet Modal -->
    <CreateWalletModal :show="showCreateWalletModal" @close="showCreateWalletModal = false" @create-wallet="handleCreateWallet" />

    <!-- Edit Wallet Modal -->
    <EditWalletModal :show="showEditWalletModal" :wallet="treasuryStore.selectedWallet" @close="showEditWalletModal = false" @update-wallet="handleUpdateWallet" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useTreasuryStore } from '../stores/treasury';
import { useAuthStore } from '../stores/auth';
import CreateWalletModal from '../components/CreateWalletModal.vue';
import EditWalletModal from '../components/EditWalletModal.vue';
import CreateDepositModal from '../components/CreateDepositModal.vue';
import CreateWithdrawalModal from '../components/CreateWithdrawalModal.vue';

const treasuryStore = useTreasuryStore();
const authStore = useAuthStore();

const activeTab = ref('transactions');
const selectedWalletId = ref(null);
const reportPeriod = ref(30);

const showCreateWalletModal = ref(false);
const showEditWalletModal = ref(false);
const showCreateDepositModal = ref(false);
const showCreateWithdrawalModal = ref(false);

const filters = ref({
  type: '',
  status: '',
  category: '',
});

const tabs = [
  { id: 'transactions', label: 'Transactions' },
  { id: 'reports', label: 'Reports' },
  { id: 'pending', label: 'Pending' },
];

const isAdmin = computed(() => {
  // Check if user has treasury management permission
  return authStore.user?.permissions?.includes('org.manage_treasury') || false;
});

const filteredTransactions = computed(() => {
  let txs = treasuryStore.transactions;
  
  if (filters.value.type) {
    txs = txs.filter(t => t.type === filters.value.type);
  }
  if (filters.value.status) {
    txs = txs.filter(t => t.status === filters.value.status);
  }
  if (filters.value.category) {
    txs = txs.filter(t => t.category === filters.value.category);
  }
  
  return txs;
});

const formatAmount = (amount) => {
  return amount.toLocaleString();
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCategory = (category) => {
  return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getWalletName = (walletId) => {
  const wallet = treasuryStore.wallets.find(w => w.id === walletId);
  return wallet?.name || 'Unknown';
};

const handleWalletChange = () => {
  treasuryStore.selectWallet(selectedWalletId.value);
  applyFilters(); // Re-apply filters for the new wallet
};

const applyFilters = () => {
  if (treasuryStore.selectedWallet) {
    treasuryStore.fetchTransactions(treasuryStore.selectedWallet.id, filters.value);
  }
};

const handleCreateWallet = async (walletData) => {
  try {
    await treasuryStore.createWallet(walletData);
    showCreateWalletModal.value = false;
  } catch (err) {
    alert(err.message || 'Failed to create wallet');
  }
};

const handleUpdateWallet = async ({ id, data }) => {
  try {
    await treasuryStore.updateWallet(id, data);
    showEditWalletModal.value = false;
  } catch (err) {
    alert(err.message || 'Failed to update wallet');
  }
};

const handleDeleteWallet = async () => {
  if (!treasuryStore.selectedWallet) return;

  if (confirm(`Are you sure you want to delete the wallet "${treasuryStore.selectedWallet.name}"? This cannot be undone.`)) {
    try {
      await treasuryStore.deleteWallet(treasuryStore.selectedWallet.id);
      alert('Wallet deleted successfully!');
      // Re-fetch wallets and select a new one (e.g., primary or first available)
      await treasuryStore.fetchWallets();
      if (treasuryStore.wallets.length > 0) {
        treasuryStore.selectWallet(treasuryStore.wallets[0].id);
        selectedWalletId.value = treasuryStore.wallets[0].id;
        applyFilters();
      } else {
        selectedWalletId.value = null;
        treasuryStore.setSelectedWallet(null); // Clear selected wallet in store
      }
    } catch (err) {
      alert(err.message || 'Failed to delete wallet.');
    }
  }
};

const handleTransactionCompleted = () => {
  showCreateDepositModal.value = false;
  showCreateWithdrawalModal.value = false;
  // Refresh wallet data and transactions after a successful transaction
  treasuryStore.fetchWallets(); // To update balances
  if (treasuryStore.selectedWallet) {
    treasuryStore.fetchTransactions(treasuryStore.selectedWallet.id, filters.value);
  }
};

const fetchReport = async () => {
  if (treasuryStore.selectedWallet) {
    await treasuryStore.fetchReport(treasuryStore.selectedWallet.id, reportPeriod.value);
  }
};

const approveTransaction = async (txId) => {
  try {
    await treasuryStore.approveTransaction(txId);
    alert('Transaction approved!');
    treasuryStore.fetchPendingTransactions(); // Refresh pending list
    treasuryStore.fetchWallets(); // Refresh wallet balances
    if (treasuryStore.selectedWallet) {
      treasuryStore.fetchTransactions(treasuryStore.selectedWallet.id, filters.value);
    }
  } catch (err) {
    alert(err.message || 'Failed to approve transaction.');
  }
};

const rejectTransaction = async (txId) => {
  try {
    await treasuryStore.rejectTransaction(txId);
    alert('Transaction rejected!');
    treasuryStore.fetchPendingTransactions(); // Refresh pending list
  } catch (err) {
    alert(err.message || 'Failed to reject transaction.');
  }
};

// Watch for tab changes
watch(activeTab, (newTab) => {
  if (newTab === 'pending' && isAdmin.value) {
    treasuryStore.fetchPendingTransactions();
  } else if (newTab === 'reports') {
    fetchReport();
  }
}, { immediate: true }); // Fetch initial data for reports/pending if they are default tab

onMounted(async () => {
  await treasuryStore.fetchWallets();
  if (treasuryStore.wallets.length > 0) {
    // If no wallet is selected, select the first or primary
    if (!treasuryStore.selectedWallet) {
      const primary = treasuryStore.wallets.find(w => w.is_primary) || treasuryStore.wallets[0];
      treasuryStore.selectWallet(primary.id);
      selectedWalletId.value = primary.id;
    } else {
      selectedWalletId.value = treasuryStore.selectedWallet.id;
    }
    applyFilters();
  }
});
</script>