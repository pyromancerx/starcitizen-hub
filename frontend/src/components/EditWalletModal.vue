<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-sc-dark p-6 rounded-lg shadow-lg w-full max-w-md border border-sc-grey/20">
      <h3 class="text-xl font-bold text-white mb-4">Edit Treasury Wallet</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4" v-if="localWallet">
        <div>
          <label for="walletName" class="block text-sc-grey text-sm font-bold mb-2">Wallet Name</label>
          <input type="text" id="walletName" v-model="localWallet.name"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>
        <div>
          <label for="description" class="block text-sc-grey text-sm font-bold mb-2">Description (Optional)</label>
          <textarea id="description" v-model="localWallet.description" rows="3"
                    class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-sc-panel text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue"></textarea>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" id="isPrimary" v-model="localWallet.is_primary"
                 class="form-checkbox h-4 w-4 text-sc-blue bg-sc-panel border-sc-grey/30 rounded focus:ring-sc-blue" />
          <label for="isPrimary" class="text-sc-grey text-sm">Set as Primary Wallet</label>
        </div>
        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';

const props = defineProps({
  show: Boolean,
  wallet: Object // The wallet object to edit
});

const emit = defineEmits(['close', 'update-wallet']);

const localWallet = ref(null);

// Watch for changes in the wallet prop to update the localWallet ref
watch(() => props.wallet, (newVal) => {
  if (newVal) {
    localWallet.value = { ...newVal }; // Create a copy to avoid mutating prop directly
  } else {
    localWallet.value = null;
  }
}, { immediate: true });

const handleSubmit = () => {
  if (localWallet.value) {
    emit('update-wallet', { id: localWallet.value.id, data: { ...localWallet.value } });
  }
};
</script>

<style scoped>
/* Add any specific styles for the modal here if needed */
</style>
