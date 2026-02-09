<template>
  <div class="min-h-screen bg-sc-dark text-white flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-sc-panel border-r border-sc-grey/10 flex-shrink-0 hidden md:flex flex-col">
      <div class="p-6 border-b border-sc-grey/10 flex items-center space-x-3">
        <img v-if="themeStore.settings.logo_url" :src="themeStore.settings.logo_url" class="h-8 w-8 object-contain" />
        <h1 class="text-lg font-bold text-sc-blue tracking-widest uppercase truncate">{{ themeStore.settings.org_name }}</h1>
      </div>
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        <router-link to="/" class="nav-link" active-class="active">Dashboard</router-link>
        
        <div class="pt-4 pb-2">
          <span class="text-[10px] font-black text-sc-grey/30 uppercase px-4 tracking-widest">Assets</span>
        </div>
        <router-link to="/fleet" class="nav-link" active-class="active">Fleet Registry</router-link>
        <router-link to="/inventory" class="nav-link" active-class="active">Inventory</router-link>
        <router-link to="/wallet" class="nav-link" active-class="active">Financials</router-link>
        <router-link to="/stockpiles" class="nav-link" active-class="active">Org Stockpiles</router-link>

        <div class="pt-4 pb-2">
          <span class="text-[10px] font-black text-sc-grey/30 uppercase px-4 tracking-widest">Social</span>
        </div>
        <router-link to="/events" class="nav-link" active-class="active">Operations</router-link>
        <router-link to="/forum" class="nav-link" active-class="active">Spectrum Forum</router-link>
        <router-link to="/members" class="nav-link" active-class="active">Personnel</router-link>

        <div class="pt-4 pb-2">
          <span class="text-[10px] font-black text-sc-grey/30 uppercase px-4 tracking-widest">Logistics</span>
        </div>
        <router-link to="/projects" class="nav-link" active-class="active">Active Projects</router-link>
        <router-link to="/federation" class="nav-link" active-class="active">Federation</router-link>

        <div class="pt-4 pb-2">
          <span class="text-[10px] font-black text-sc-grey/30 uppercase px-4 tracking-widest">Trading</span>
        </div>
        <router-link to="/trade-runs" class="nav-link" active-class="active">Trade Runs</router-link>
        <router-link to="/prices" class="nav-link" active-class="active">Price Database</router-link>
        <router-link to="/contracts" class="nav-link" active-class="active">Cargo Contracts</router-link>

        <div class="pt-4 pb-2">
          <span class="text-[10px] font-black text-sc-grey/30 uppercase px-4 tracking-widest">Multi-Crew</span>
        </div>
        <router-link to="/crew-finder" class="nav-link" active-class="active">Crew Finder (LFG)</router-link>
        <router-link to="/availability" class="nav-link" active-class="active">Availability</router-link>
        <router-link to="/crew-loadouts" class="nav-link" active-class="active">Crew Loadouts</router-link>

        <div class="pt-4 pb-2">
          <span class="text-[10px] font-black text-sc-grey/30 uppercase px-4 tracking-widest">Command</span>
        </div>
        <router-link to="/admin" class="nav-link" active-class="active text-yellow-500">System Admin</router-link>
      </nav>
      
      <div class="p-4 border-t border-sc-grey/10 bg-black/20">
        <button @click="handleLogout" class="flex items-center space-x-3 text-sc-grey/50 hover:text-red-400 transition-colors w-full px-4 py-2 text-xs font-bold uppercase tracking-widest">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span>Log Out</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header -->
      <header class="bg-sc-panel border-b border-sc-grey/10 h-16 flex items-center justify-between px-8 shadow-2xl z-20">
        <div class="md:hidden flex items-center space-x-2">
           <img v-if="themeStore.settings.logo_url" :src="themeStore.settings.logo_url" class="h-6 w-6 object-contain" />
           <span class="text-xl font-bold text-sc-blue uppercase">{{ themeStore.settings.org_name }}</span>
        </div>
        
        <div class="hidden md:flex items-center space-x-2 text-sc-grey/30 text-[10px] font-bold uppercase tracking-widest">
          <span class="text-sc-blue">System</span>
          <span class="h-1 w-1 rounded-full bg-sc-grey/30"></span>
          <span>Stanton</span>
          <span class="h-1 w-1 rounded-full bg-sc-grey/30"></span>
          <span>Online</span>
        </div>

        <div class="flex items-center space-x-6 ml-auto">
          <div class="text-right hidden sm:block">
            <div class="text-xs font-bold text-white uppercase tracking-tight">Citizen Pilot</div>
            <div class="text-[8px] text-sc-blue font-black uppercase tracking-widest">Verified Signal</div>
          </div>
          <div class="h-10 w-10 rounded bg-sc-panel border border-sc-blue/30 flex items-center justify-center text-sc-blue shadow-[0_0_10px_rgba(102,252,241,0.2)]">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          </div>
        </div>
      </header>

      <!-- Content Area -->
      <div class="flex-1 overflow-y-auto p-8 custom-scrollbar bg-sc-dark/50">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useThemeStore } from '../stores/theme';

const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const handleLogout = () => {
  authStore.logout();
  router.push({ name: 'login' });
};
</script>

<style scoped>
.nav-link {
  @apply block px-4 py-2.5 rounded text-xs font-bold uppercase tracking-widest text-sc-grey/60 hover:bg-white/5 hover:text-white transition-all duration-200 border-l-2 border-transparent;
}

.nav-link.active {
  @apply bg-sc-blue/10 text-sc-blue border-sc-blue shadow-[inset_0_0_10px_rgba(102,252,241,0.05)];
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-sc-blue/20 rounded;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  @apply bg-sc-blue/40;
}
</style>