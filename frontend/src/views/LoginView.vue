<template>
  <div class="min-h-screen flex items-center justify-center bg-sc-dark text-white bg-[url('/assets/bg-space.jpg')] bg-cover bg-center">
    <div class="absolute inset-0 bg-black/70"></div>
    <div class="relative z-10 w-full max-w-md p-8 bg-sc-panel border border-sc-blue/30 rounded-lg shadow-2xl backdrop-blur-sm">
      <h2 class="text-3xl font-bold mb-6 text-center text-sc-blue tracking-widest uppercase">Star Citizen Hub</h2>
      
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-sc-grey mb-2">Email Address</label>
          <input 
            v-model="email" 
            type="email" 
            required 
            class="w-full px-4 py-2 bg-black/50 border border-sc-grey/30 rounded focus:ring-2 focus:ring-sc-blue focus:border-transparent outline-none text-white transition-all"
            placeholder="pilot@example.com"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-sc-grey mb-2">Password</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            class="w-full px-4 py-2 bg-black/50 border border-sc-grey/30 rounded focus:ring-2 focus:ring-sc-blue focus:border-transparent outline-none text-white transition-all"
            placeholder="••••••••"
          />
        </div>

        <div v-if="authStore.error" class="text-red-500 text-sm text-center bg-red-900/20 p-2 rounded border border-red-500/30">
          {{ authStore.error }}
        </div>

        <button 
          type="submit" 
          :disabled="authStore.isLoading"
          class="w-full py-3 px-4 bg-sc-blue/10 hover:bg-sc-blue/20 border border-sc-blue text-sc-blue font-bold rounded uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_15px_rgba(102,252,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ authStore.isLoading ? 'Initializing...' : 'Login' }}
        </button>
      </form>
      
      <p class="mt-6 text-center text-sm text-sc-grey">
        No account? <a href="#" class="text-sc-light-blue hover:text-sc-blue hover:underline">Request Access</a>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const email = ref('');
const password = ref('');
const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
  try {
    await authStore.login(email.value, password.value);
    router.push({ name: 'dashboard' });
  } catch (e) {
    // Error handled in store
  }
};
</script>
