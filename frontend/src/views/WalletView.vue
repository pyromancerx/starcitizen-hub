<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Financial Terminal</h2>
    </div>

    <!-- Balance Banner -->
    <div class="bg-gradient-to-r from-sc-panel to-sc-dark border border-sc-blue/30 rounded-lg p-8 flex flex-col md:flex-row justify-between items-center shadow-[0_0_20px_rgba(102,252,241,0.1)]">
      <div>
        <div class="text-xs text-sc-blue font-bold uppercase tracking-widest mb-1">Available Funds</div>
        <div class="text-5xl font-mono font-bold text-white flex items-baseline">
          {{ walletStore.wallet?.balance_auec.toLocaleString() || '0' }}
          <span class="text-xl ml-2 text-sc-blue/70">aUEC</span>
        </div>
      </div>
      <div class="mt-6 md:mt-0 flex space-x-4">
        <button class="px-6 py-3 bg-sc-blue text-sc-dark font-bold uppercase tracking-widest text-sm rounded hover:bg-white transition-all">Transfer Funds</button>
        <button class="px-6 py-3 border border-sc-grey/30 text-sc-grey font-bold uppercase tracking-widest text-sm rounded hover:border-sc-blue hover:text-white transition-all">Request Payout</button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Transaction History -->
      <div class="lg:col-span-2 space-y-4">
        <h3 class="text-lg font-bold text-white uppercase tracking-wider flex items-center">
          <span class="mr-2 h-4 w-1 bg-sc-blue"></span>
          Recent Transactions
        </h3>
        <div class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden">
          <div v-if="walletStore.transactions.length === 0" class="p-12 text-center text-sc-grey/50 italic uppercase tracking-tighter">
            No transaction records found.
          </div>
          <div v-else class="divide-y border-sc-grey/5">
            <div v-for="tx in walletStore.transactions" :key="tx.id" class="p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
              <div class="flex items-center space-x-4">
                <div :class="tx.amount > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'" class="h-10 w-10 rounded flex items-center justify-center font-bold">
                  {{ tx.amount > 0 ? '+' : '-' }}
                </div>
                <div>
                  <div class="text-sm font-semibold text-white">{{ tx.description || tx.transaction_type }}</div>
                  <div class="text-[10px] text-sc-grey/50 uppercase">{{ new Date(tx.created_at).toLocaleString() }}</div>
                </div>
              </div>
              <div :class="tx.amount > 0 ? 'text-green-400' : 'text-red-400'" class="font-mono font-bold">
                {{ tx.amount.toLocaleString() }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Financial Status -->
      <div class="space-y-4">
        <h3 class="text-lg font-bold text-white uppercase tracking-wider flex items-center">
          <span class="mr-2 h-4 w-1 bg-sc-blue"></span>
          Network Status
        </h3>
        <div class="bg-sc-panel border border-sc-grey/10 rounded-lg p-6 space-y-6">
          <div>
            <div class="text-[10px] text-sc-grey/50 uppercase mb-2">Internal Org Exchange</div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-green-400">Operational</span>
              <span class="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_5px_#4ade80]"></span>
            </div>
          </div>
          <div>
            <div class="text-[10px] text-sc-grey/50 uppercase mb-2">Federated Peering</div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-sc-blue">Active</span>
              <span class="h-2 w-2 rounded-full bg-sc-blue shadow-[0_0_5px_#66fcf1]"></span>
            </div>
          </div>
          <div class="pt-4 border-t border-sc-grey/10">
            <p class="text-[10px] text-sc-grey/40 leading-relaxed italic">
              All transactions are logged via HMAC-signed requests across the federated network. Ensure your terminal is secured.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <TransferFundsModal :show="showTransferModal" @close="showTransferModal = false" @transfer-funds="handleTransferFunds" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useWalletStore } from '../stores/assets';
import TransferFundsModal from '../components/TransferFundsModal.vue';

const walletStore = useWalletStore();
const showTransferModal = ref(false);

onMounted(() => {
  walletStore.fetchWallet();
});

const handleTransferFunds = async (transferData) => {
  await walletStore.transferFunds(transferData);
  showTransferModal.value = false;
};
</script>
