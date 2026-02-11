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
        <router-link to="/operations" class="nav-link" active-class="active">Operations</router-link>
        <router-link to="/events" class="nav-link" active-class="active">Events</router-link>
        <router-link to="/forum" class="nav-link" active-class="active">Spectrum Forum</router-link>
        <router-link to="/members" class="nav-link" active-class="active">Personnel</router-link>
        <router-link to="/messages" class="nav-link" active-class="active">
          Messages
          <span v-if="messageUnreadCount > 0" class="ml-2 bg-sc-blue text-black text-[10px] px-1.5 rounded-full">{{ messageUnreadCount }}</span>
        </router-link>

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
          <span class="text-[10px] font-black text-sc-grey/30 uppercase px-4 tracking-widest">Recognition</span>
        </div>
        <router-link to="/achievements" class="nav-link" active-class="active">Achievements</router-link>

        <div class="pt-4 pb-2">
          <span class="text-[10px] font-black text-sc-grey/30 uppercase px-4 tracking-widest">Command</span>
        </div>
        <router-link to="/treasury" class="nav-link" active-class="active text-yellow-500">Org Treasury</router-link>
        <router-link to="/admin" class="nav-link" active-class="active text-yellow-500">System Admin</router-link>
        <router-link to="/admin/rsi-verification" class="nav-link" active-class="active text-yellow-500">RSI Verification</router-link>
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
        
        <div class="hidden md:flex items-center flex-1 max-w-md mx-8 relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-4 w-4 text-sc-grey/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input 
            v-model="searchQuery" 
            @input="handleSearch"
            @focus="showSearchResults = true"
            @blur="setTimeout(() => showSearchResults = false, 200)"
            type="text" 
            placeholder="Search Hub..." 
            class="bg-sc-dark/50 border border-sc-grey/10 rounded w-full py-1.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-sc-blue/50 transition-all placeholder-sc-grey/20"
          />
          
          <!-- Search Results Dropdown -->
          <div v-if="showSearchResults && (hasResults || isSearching)" class="absolute top-full left-0 right-0 mt-2 bg-sc-panel border border-sc-blue/20 rounded shadow-2xl z-50 max-h-96 overflow-y-auto custom-scrollbar">
            <div v-if="isSearching" class="p-4 text-center text-xs text-sc-grey/50 italic">Scanning database...</div>
            <div v-else-if="!hasResults" class="p-4 text-center text-xs text-sc-grey/50">No signals found.</div>
            <div v-else class="py-2">
              <div v-for="(group, type) in searchResults" :key="type">
                <div v-if="group.length > 0">
                  <div class="px-4 py-1 text-[8px] font-black text-sc-blue uppercase tracking-widest bg-sc-blue/5">{{ type }}</div>
                  <router-link 
                    v-for="item in group" 
                    :key="item.id" 
                    :to="item.link"
                    class="block px-4 py-2 hover:bg-white/5 transition-colors group"
                  >
                    <div class="text-xs font-bold text-white group-hover:text-sc-blue">{{ item.title }}</div>
                    <div v-if="item.subtitle" class="text-[10px] text-sc-grey/40">{{ item.subtitle }}</div>
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>

         <div class="flex items-center space-x-6 ml-auto">
           <NotificationBell />
           <router-link to="/profile" class="flex items-center space-x-3 hover:opacity-80 transition-opacity">
             <div class="text-right hidden sm:block">
               <div class="text-xs font-bold text-white uppercase tracking-tight">Citizen Pilot</div>
               <div class="text-[8px] text-sc-blue font-black uppercase tracking-widest">Verified Signal</div>
             </div>
             <div class="h-10 w-10 rounded bg-sc-panel border border-sc-blue/30 flex items-center justify-center text-sc-blue shadow-[0_0_10px_rgba(102,252,241,0.2)]">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
             </div>
           </router-link>
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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import api from '../services/api';
import { useAuthStore } from '../stores/auth';
import { useThemeStore } from '../stores/theme';
import { useMessageStore } from '../stores/message';
import NotificationBell from './NotificationBell.vue';

const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const messageStore = useMessageStore();

const messageUnreadCount = ref(0);
let messagePolling = null;

const searchQuery = ref('');
const isSearching = ref(false);
const showSearchResults = ref(false);
const searchResults = ref({
  members: [],
  ships: [],
  projects: [],
  threads: []
});

const hasResults = computed(() => {
  return Object.values(searchResults.value).some(group => group.length > 0);
});

let searchTimeout = null;
const handleSearch = () => {
  if (searchQuery.value.length < 2) {
    searchResults.value = { members: [], ships: [], projects: [], threads: [] };
    return;
  }

  clearTimeout(searchTimeout);
  isSearching.value = true;
  searchTimeout = setTimeout(async () => {
    try {
      const res = await api.get('/search', { params: { q: searchQuery.value } });
      searchResults.value = res.data;
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      isSearching.value = false;
    }
  }, 300);
};

onMounted(() => {
  // Fetch initial unread count
  messageStore.fetchUnreadCount().then(() => {
    messageUnreadCount.value = messageStore.unreadCount;
  });
  
  // Poll for unread count every 30 seconds
  messagePolling = setInterval(() => {
    messageStore.fetchUnreadCount().then(() => {
      messageUnreadCount.value = messageStore.unreadCount;
    });
  }, 30000);
});

onUnmounted(() => {
  if (messagePolling) {
    clearInterval(messagePolling);
  }
});

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