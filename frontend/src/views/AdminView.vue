<template>
  <div class="space-y-8">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Command Console</h2>
    </div>

    <!-- Tabs -->
    <div class="flex space-x-4 border-b border-sc-grey/10">
      <button 
        @click="activeTab = 'users'" 
        :class="activeTab === 'users' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey hover:text-white'"
        class="px-4 py-2 text-sm font-bold uppercase tracking-widest border-b-2 transition-all"
      >
        Personnel
      </button>
      <button 
        @click="activeTab = 'theme'" 
        :class="activeTab === 'theme' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey hover:text-white'"
        class="px-4 py-2 text-sm font-bold uppercase tracking-widest border-b-2 transition-all"
      >
        System Theme
      </button>
    </div>

    <!-- User Management Tab -->
    <section v-if="activeTab === 'users'" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-sc-panel border border-sc-grey/10 p-4 rounded-lg">
          <div class="text-[10px] text-sc-grey/50 uppercase font-black">Total Personnel</div>
          <div class="text-2xl font-bold text-white">{{ memberStore.members.length }}</div>
        </div>
        <div class="bg-sc-panel border border-sc-grey/10 p-4 rounded-lg">
          <div class="text-[10px] text-sc-grey/50 uppercase font-black">Pending Approval</div>
          <div class="text-2xl font-bold text-yellow-500">{{ pendingUsers.length }}</div>
        </div>
      </div>

      <h3 class="text-xs text-sc-grey/50 uppercase font-black tracking-widest flex items-center">
        <span class="mr-2 h-px w-8 bg-sc-blue/30"></span> Personnel Authorization
      </h3>
      
      <div class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden shadow-2xl">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-black/20 text-[10px] text-sc-grey/50 uppercase tracking-widest font-bold">
              <th class="p-4 border-b border-sc-grey/10">Personnel</th>
              <th class="p-4 border-b border-sc-grey/10">Handle</th>
              <th class="p-4 border-b border-sc-grey/10">Status</th>
              <th class="p-4 border-b border-sc-grey/10 text-right">Clearance</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            <tr v-for="user in memberStore.members" :key="user.id" class="hover:bg-white/5 border-b border-sc-grey/5 transition-colors">
              <td class="p-4">
                <div class="font-bold text-white uppercase tracking-tight">{{ user.display_name }}</div>
                <div class="text-[10px] text-sc-grey/50">{{ user.email }}</div>
              </td>
              <td class="p-4 text-sc-blue font-mono text-xs">{{ user.rsi_handle }}</td>
              <td class="p-4">
                <span v-if="user.is_approved" class="px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[8px] font-bold uppercase border border-green-500/20">Verified</span>
                <span v-else class="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 text-[8px] font-bold uppercase border border-yellow-500/20">Pending</span>
              </td>
              <td class="p-4 text-right">
                <button v-if="!user.is_approved" @click="handleApprove(user.id)" class="px-3 py-1 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-black uppercase tracking-widest rounded hover:bg-sc-blue hover:text-sc-dark transition-all">Authorize</button>
                <button v-else class="text-sc-grey/30 hover:text-red-400 transition-colors ml-4 text-[10px] font-black uppercase">Revoke</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Theme Tab -->
    <section v-if="activeTab === 'theme'" class="space-y-8">
      <div class="bg-sc-panel border border-sc-grey/10 rounded-lg p-8">
        <h3 class="text-xs text-sc-grey/50 uppercase font-black tracking-widest mb-6 flex items-center">
          <span class="mr-2 h-px w-8 bg-sc-blue/30"></span> Org Branding
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Org Identity -->
          <div class="space-y-4">
            <label class="block text-sm font-bold text-white uppercase">Organization Name</label>
            <input v-model="theme.org_name" type="text" class="w-full bg-black/30 border border-sc-grey/20 rounded p-2 text-white focus:border-sc-blue/50 outline-none" />
            
            <label class="block text-sm font-bold text-white uppercase mt-6">Logo Upload</label>
            <div class="flex items-center space-x-4">
              <div class="h-16 w-16 bg-black/30 border border-sc-grey/20 rounded flex items-center justify-center overflow-hidden">
                <img v-if="theme.logo_url" :src="theme.logo_url" class="h-full w-full object-contain" />
                <span v-else class="text-xs text-sc-grey/30">None</span>
              </div>
              <input type="file" @change="handleLogoUpload" class="text-xs text-sc-grey" accept="image/*" />
            </div>
          </div>

          <!-- Color Palette -->
          <div class="space-y-4">
            <label class="block text-sm font-bold text-white uppercase">Color Palette</label>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-[10px] text-sc-grey/50 uppercase">Primary Accent (Blue)</label>
                <div class="flex space-x-2 mt-1">
                  <input v-model="theme.color_sc_blue" type="color" class="h-8 w-8 bg-transparent border-none cursor-pointer" />
                  <input v-model="theme.color_sc_blue" type="text" class="flex-1 bg-black/30 border border-sc-grey/20 rounded px-2 text-xs font-mono text-white" />
                </div>
              </div>
              
              <div>
                <label class="text-[10px] text-sc-grey/50 uppercase">Secondary Accent</label>
                <div class="flex space-x-2 mt-1">
                  <input v-model="theme.color_sc_light_blue" type="color" class="h-8 w-8 bg-transparent border-none cursor-pointer" />
                  <input v-model="theme.color_sc_light_blue" type="text" class="flex-1 bg-black/30 border border-sc-grey/20 rounded px-2 text-xs font-mono text-white" />
                </div>
              </div>

              <div>
                <label class="text-[10px] text-sc-grey/50 uppercase">Panel Background</label>
                <div class="flex space-x-2 mt-1">
                  <input v-model="theme.color_sc_panel" type="color" class="h-8 w-8 bg-transparent border-none cursor-pointer" />
                  <input v-model="theme.color_sc_panel" type="text" class="flex-1 bg-black/30 border border-sc-grey/20 rounded px-2 text-xs font-mono text-white" />
                </div>
              </div>

              <div>
                <label class="text-[10px] text-sc-grey/50 uppercase">Base Dark</label>
                <div class="flex space-x-2 mt-1">
                  <input v-model="theme.color_sc_dark" type="color" class="h-8 w-8 bg-transparent border-none cursor-pointer" />
                  <input v-model="theme.color_sc_dark" type="text" class="flex-1 bg-black/30 border border-sc-grey/20 rounded px-2 text-xs font-mono text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 pt-6 border-t border-sc-grey/10 flex justify-end">
          <button @click="saveTheme" class="px-6 py-2 bg-sc-blue text-sc-dark font-bold uppercase tracking-widest text-xs rounded hover:bg-white transition-all shadow-[0_0_15px_rgba(102,252,241,0.2)]">
            Save System Theme
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useMemberStore } from '../stores/members';
import { useAdminStore } from '../stores/admin';
import { useThemeStore } from '../stores/theme'; // We need to create this

const memberStore = useMemberStore();
const adminStore = useAdminStore();
const themeStore = useThemeStore();

const activeTab = ref('users');
const theme = ref({});

const pendingUsers = computed(() => memberStore.members.filter(u => !u.is_approved));

const handleApprove = async (userId) => {
  if (confirm('Authorize this pilot for hub access?')) {
    await adminStore.approveUser(userId);
    await memberStore.fetchMembers();
  }
};

const handleLogoUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const res = await themeStore.uploadLogo(formData);
    theme.value.logo_url = res.url;
  } catch (e) {
    alert('Upload failed');
  }
};

const saveTheme = async () => {
  try {
    await themeStore.updateTheme(theme.value);
    alert('Theme updated successfully');
  } catch (e) {
    alert('Failed to update theme');
  }
};

onMounted(async () => {
  memberStore.fetchMembers();
  await themeStore.fetchTheme();
  // Deep copy to local state for editing
  theme.value = JSON.parse(JSON.stringify(themeStore.settings));
});
</script>