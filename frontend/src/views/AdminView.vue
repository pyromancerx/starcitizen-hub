<template>
  <div class="space-y-8">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Command Console</h2>
    </div>

    <!-- Navigation for Admin Sections -->
    <div class="flex space-x-4 border-b border-sc-grey/10 pb-2">
      <router-link 
        :to="{ name: 'admin-personnel' }" 
        class="px-4 py-2 text-sm font-bold uppercase tracking-widest border-b-2 transition-all"
        :class="$route.name === 'admin-personnel' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey hover:text-white'"
      >
        Personnel
      </router-link>
      <router-link 
        :to="{ name: 'admin-theme' }" 
        class="px-4 py-2 text-sm font-bold uppercase tracking-widest border-b-2 transition-all"
        :class="$route.name === 'admin-theme' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey hover:text-white'"
      >
        System Theme
      </router-link>
      <router-link 
        :to="{ name: 'rsi-admin' }" 
        class="px-4 py-2 text-sm font-bold uppercase tracking-widest border-b-2 transition-all"
        :class="$route.name === 'rsi-admin' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey hover:text-white'"
      >
        RSI Verification
      </router-link>
              <router-link 
                :to="{ name: 'admin-announcements' }" 
                class="px-4 py-2 text-sm font-bold uppercase tracking-widest border-b-2 transition-all"
                :class="$route.name === 'admin-announcements' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey hover:text-white'"
              >
                Announcements
              </router-link>
                      <router-link 
                        :to="{ name: 'admin-discord-settings' }" 
                        class="px-4 py-2 text-sm font-bold uppercase tracking-widest border-b-2 transition-all"
                        :class="$route.name === 'admin-discord-settings' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey hover:text-white'"
                      >
                        Discord Settings
                      </router-link>
                      <router-link 
                        :to="{ name: 'admin-audit-log' }" 
                        class="px-4 py-2 text-sm font-bold uppercase tracking-widest border-b-2 transition-all"
                        :class="$route.name === 'admin-audit-log' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey hover:text-white'"
                      >
                        Audit Log
                      </router-link>
                      <router-link 
                        :to="{ name: 'admin-system-settings' }" 
                        class="px-4 py-2 text-sm font-bold uppercase tracking-widest border-b-2 transition-all"
                        :class="$route.name === 'admin-system-settings' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey hover:text-white'"
                      >
                        System Settings
                      </router-link>    </div>

    <!-- Router View for Admin Sub-sections -->
    <router-view></router-view>
  </div>
</template>

<script setup>
// No script needed for this view as it's a wrapper
</script>