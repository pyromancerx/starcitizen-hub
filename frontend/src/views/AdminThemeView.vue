<template>
  <section class="space-y-8">
    <div class="bg-sc-panel border border-sc-grey/10 rounded-lg p-8">
      <h3 class="text-xs text-sc-grey/50 uppercase font-black tracking-widest mb-6 flex items-center">
        <span class="mr-2 h-px w-8 bg-sc-blue/30"></span> Org Branding
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Org Identity -->
        <div class="space-y-4">
          <label class="block text-sm font-bold text-white uppercase">Organization Name</label>
          <input v-model="themeStore.settings.org_name" type="text" class="w-full bg-black/30 border border-sc-grey/20 rounded p-2 text-white focus:border-sc-blue/50 outline-none" />
          
          <label class="block text-sm font-bold text-white uppercase mt-6">Logo Upload</label>
          <div class="flex items-center space-x-4">
            <div class="h-16 w-16 bg-black/30 border border-sc-grey/20 rounded flex items-center justify-center overflow-hidden">
              <img v-if="themeStore.settings.logo_url" :src="themeStore.settings.logo_url" class="h-full w-full object-contain" />
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
                <input v-model="themeStore.settings.color_sc_blue" type="color" class="h-8 w-8 bg-transparent border-none cursor-pointer" />
                <input v-model="themeStore.settings.color_sc_blue" type="text" class="flex-1 bg-black/30 border border-sc-grey/20 rounded px-2 text-xs font-mono text-white" />
              </div>
            </div>
            
            <div>
              <label class="text-[10px] text-sc-grey/50 uppercase">Secondary Accent</label>
              <div class="flex space-x-2 mt-1">
                <input v-model="themeStore.settings.color_sc_light_blue" type="color" class="h-8 w-8 bg-transparent border-none cursor-pointer" />
                <input v-model="themeStore.settings.color_sc_light_blue" type="text" class="flex-1 bg-black/30 border border-sc-grey/20 rounded px-2 text-xs font-mono text-white" />
              </div>
            </div>

            <div>
              <label class="text-[10px] text-sc-grey/50 uppercase">Panel Background</label>
              <div class="flex space-x-2 mt-1">
                <input v-model="themeStore.settings.color_sc_panel" type="color" class="h-8 w-8 bg-transparent border-none cursor-pointer" />
                <input v-model="themeStore.settings.color_sc_panel" type="text" class="flex-1 bg-black/30 border border-sc-grey/20 rounded px-2 text-xs font-mono text-white" />
              </div>
            </div>

            <div>
              <label class="text-[10px] text-sc-grey/50 uppercase">Base Dark</label>
              <div class="flex space-x-2 mt-1">
                <input v-model="themeStore.settings.color_sc_dark" type="color" class="h-8 w-8 bg-transparent border-none cursor-pointer" />
                <input v-model="themeStore.settings.color_sc_dark" type="text" class="flex-1 bg-black/30 border border-sc-grey/20 rounded px-2 text-xs font-mono text-white" />
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
</template>

<script setup>
import { onMounted } from 'vue';
import { useThemeStore } from '../stores/theme';

const themeStore = useThemeStore();

const handleLogoUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    await themeStore.uploadLogo(formData);
  } catch (e) {
    // Error handling is already in the store, just prevent further action
  }
};

const saveTheme = async () => {
  try {
    await themeStore.updateTheme(themeStore.settings);
  } catch (e) {
    // Error handling is already in the store, just prevent further action
  }
};

onMounted(async () => {
  await themeStore.fetchTheme();
});
</script>