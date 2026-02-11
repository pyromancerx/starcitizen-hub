<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Discord Integration Settings</h2>

    <div v-if="isLoading" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else>
      <!-- Core Settings Form -->
      <div class="bg-sc-panel border border-sc-grey/10 rounded-lg shadow-xl p-8">
        <form @submit.prevent="saveSettings" class="space-y-6">
          <h3 class="text-lg font-bold text-white mb-4">Core Settings</h3>
          <!-- Guild ID -->
          <div>
            <label for="guild_id" class="block text-sc-grey text-sm font-bold mb-2">Discord Guild ID</label>
            <input type="text" id="guild_id" v-model="settingsForm.guild_id"
                  class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
            <p class="text-xs text-sc-grey/70 mt-1">The ID of your Discord server/guild. This is required for most integrations.</p>
          </div>

          <!-- Bot Token -->
          <div>
            <label for="bot_token" class="block text-sc-grey text-sm font-bold mb-2">Discord Bot Token</label>
            <input :type="showBotToken ? 'text' : 'password'" id="bot_token" v-model="settingsForm.bot_token"
                  class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
            <button type="button" @click="showBotToken = !showBotToken" class="text-sc-blue text-xs mt-1">{{ showBotToken ? 'Hide' : 'Show' }} Token</button>
            <p class="text-xs text-sc-grey/70 mt-1">Keep this secret! Used for bot actions like role syncing.</p>
          </div>

          <h3 class="text-lg font-bold text-white mb-4 mt-8">OAuth Settings (for user linking)</h3>
          <!-- OAuth Client ID -->
          <div>
            <label for="oauth_client_id" class="block text-sc-grey text-sm font-bold mb-2">OAuth Client ID</label>
            <input type="text" id="oauth_client_id" v-model="settingsForm.oauth_client_id"
                  class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
            <p class="text-xs text-sc-grey/70 mt-1">Your Discord Application's Client ID.</p>
          </div>

          <!-- OAuth Client Secret -->
          <div>
            <label for="oauth_client_secret" class="block text-sc-grey text-sm font-bold mb-2">OAuth Client Secret</label>
            <input :type="showOAuthSecret ? 'text' : 'password'" id="oauth_client_secret" v-model="settingsForm.oauth_client_secret"
                  class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" />
            <button type="button" @click="showOAuthSecret = !showOAuthSecret" class="text-sc-blue text-xs mt-1">{{ showOAuthSecret ? 'Hide' : 'Show' }} Secret</button>
            <p class="text-xs text-sc-grey/70 mt-1">Keep this secret! Used for exchanging OAuth codes for tokens.</p>
          </div>

          <h3 class="text-lg font-bold text-white mb-4 mt-8">Auto-Post Settings</h3>
          <div class="space-y-2">
            <div v-for="(enabled, feature) in settingsForm.auto_post_settings" :key="feature">
              <input type="checkbox" :id="`autopost_${feature}`" v-model="settingsForm.auto_post_settings[feature]" class="mr-2">
              <label :for="`autopost_${feature}`" class="text-white capitalize">{{ feature }}</label>
            </div>
            <p class="text-xs text-sc-grey/70 mt-1">Automatically post updates to the primary webhook for these features.</p>
          </div>

          <div class="flex justify-end space-x-4 mt-6">
            <button type="submit"
                    class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
              Save Discord Settings
            </button>
          </div>
        </form>
      </div>

      <!-- Webhook Management -->
      <div class="bg-sc-panel border border-sc-grey/10 rounded-lg shadow-xl p-8 mt-8">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-white">Webhook Management</h3>
          <button @click="showWebhookModal = true; editingWebhook = null" class="px-4 py-2 bg-sc-blue text-sc-dark text-xs font-bold uppercase tracking-widest hover:bg-white transition-all">Create Webhook</button>
        </div>

        <div class="bg-black/20 rounded-lg overflow-hidden border border-sc-grey/10">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-black/20 text-[10px] text-sc-grey/50 uppercase tracking-widest font-bold">
                <th class="p-4 border-b border-sc-grey/10">Name</th>
                <th class="p-4 border-b border-sc-grey/10">URL</th>
                <th class="p-4 border-b border-sc-grey/10">Events</th>
                <th class="p-4 border-b border-sc-grey/10">Active</th>
                <th class="p-4 border-b border-sc-grey/10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              <tr v-if="webhooks.length === 0">
                <td colspan="5" class="p-4 text-center text-sc-grey/50">No webhooks configured.</td>
              </tr>
              <tr v-for="webhook in webhooks" :key="webhook.id" class="hover:bg-white/5 border-b border-sc-grey/5 transition-colors">
                <td class="p-4 font-bold text-white">{{ webhook.name }}</td>
                <td class="p-4 text-sc-grey/70 truncate w-1/4">{{ webhook.webhook_url }}</td>
                <td class="p-4 text-sc-grey/70">
                  <span v-if="webhook.event_types && webhook.event_types.length > 0">{{ webhook.event_types.join(', ') }}</span>
                  <span v-else>None</span>
                </td>
                <td class="p-4">
                  <span :class="webhook.is_active ? 'text-green-500' : 'text-red-500'">{{ webhook.is_active ? 'Yes' : 'No' }}</span>
                </td>
                <td class="p-4 text-right">
                  <button @click="handleTestWebhook(webhook.id)" class="px-3 py-1 bg-sc-blue/10 border border-sc-blue text-sc-blue text-[10px] font-black uppercase tracking-widest rounded hover:bg-sc-blue hover:text-sc-dark transition-all mr-2">Test</button>
                  <button @click="openEditWebhookModal(webhook)" class="px-3 py-1 bg-yellow-500/10 border border-yellow-500 text-yellow-500 text-[10px] font-black uppercase tracking-widest rounded hover:bg-yellow-500 hover:text-sc-dark transition-all mr-2">Edit</button>
                  <button @click="handleDeleteWebhook(webhook.id)" class="px-3 py-1 bg-red-500/10 border border-red-500 text-red-500 text-[10px] font-black uppercase tracking-widest rounded hover:bg-red-500 hover:text-sc-dark transition-all">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Role Mapping Management -->
      <div class="bg-sc-panel border border-sc-grey/10 rounded-lg shadow-xl p-8 mt-8">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-white">Role Mapping Management</h3>
          <button @click="showRoleMappingModal = true; editingRoleMapping = null" class="px-4 py-2 bg-sc-blue text-sc-dark text-xs font-bold uppercase tracking-widest hover:bg-white transition-all">Create Role Mapping</button>
        </div>

        <div class="bg-black/20 rounded-lg overflow-hidden border border-sc-grey/10">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-black/20 text-[10px] text-sc-grey/50 uppercase tracking-widest font-bold">
                <th class="p-4 border-b border-sc-grey/10">Hub Role</th>
                <th class="p-4 border-b border-sc-grey/10">Discord Role ID</th>
                <th class="p-4 border-b border-sc-grey/10">Discord Role Name</th>
                <th class="p-4 border-b border-sc-grey/10">Sync Direction</th>
                <th class="p-4 border-b border-sc-grey/10">Active</th>
                <th class="p-4 border-b border-sc-grey/10 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              <tr v-if="roleMappings.length === 0">
                <td colspan="6" class="p-4 text-center text-sc-grey/50">No role mappings configured.</td>
              </tr>
              <tr v-for="mapping in roleMappings" :key="mapping.id" class="hover:bg-white/5 border-b border-sc-grey/5 transition-colors">
                <td class="p-4 font-bold text-white">{{ mapping.hub_role_name }}</td>
                <td class="p-4 text-sc-grey/70">{{ mapping.discord_role_id }}</td>
                <td class="p-4 text-sc-grey/70">{{ mapping.discord_role_name }}</td>
                <td class="p-4 text-sc-grey/70">{{ mapping.sync_direction }}</td>
                <td class="p-4">
                  <span :class="mapping.is_active ? 'text-green-500' : 'text-red-500'">{{ mapping.is_active ? 'Yes' : 'No' }}</span>
                </td>
                <td class="p-4 text-right">
                  <button @click="openEditRoleMappingModal(mapping)" class="px-3 py-1 bg-yellow-500/10 border border-yellow-500 text-yellow-500 text-[10px] font-black uppercase tracking-widest rounded hover:bg-yellow-500 hover:text-sc-dark transition-all mr-2">Edit</button>
                  <button @click="handleDeleteRoleMapping(mapping.id)" class="px-3 py-1 bg-red-500/10 border border-red-500 text-red-500 text-[10px] font-black uppercase tracking-widest rounded hover:bg-red-500 hover:text-sc-dark transition-all">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <AddEditWebhookModal
        :show="showWebhookModal"
        :webhook="editingWebhook"
        @close="showWebhookModal = false"
        @webhook-saved="fetchWebhooks"
      />
      <AddEditRoleMappingModal
        :show="showRoleMappingModal"
        :role-mapping="editingRoleMapping"
        @close="showRoleMappingModal = false"
        @role-mapping-saved="fetchRoleMappings"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import DiscordService from '../services/DiscordService';
import AddEditWebhookModal from '../components/AddEditWebhookModal.vue';
import AddEditRoleMappingModal from '../components/AddEditRoleMappingModal.vue';
import RoleService from '../services/RoleService';

const isLoading = ref(true);
const settingsForm = ref({
  guild_id: '',
  webhook_url: '', // This is the main webhook from DiscordIntegration model
  oauth_client_id: '',
  oauth_client_secret: '',
  bot_token: '',
  auto_post_settings: {
    announcements: false,
    events: false,
    trades: false,
    achievements: false,
    contracts: false,
  },
});
const showBotToken = ref(false);
const showOAuthSecret = ref(false);

const webhooks = ref([]);
const showWebhookModal = ref(false);
const editingWebhook = ref(null);

const roleMappings = ref([]);
const showRoleMappingModal = ref(false);
const editingRoleMapping = ref(null);

const fetchSettings = async () => {
  try {
    const settings = await DiscordService.getDiscordSettings();
    if (settings) {
      settingsForm.value = {
        guild_id: settings.guild_id || '',
        webhook_url: settings.webhook_url || '',
        oauth_client_id: settings.oauth_client_id || '',
        // Bot token and client secret are not returned by GET endpoint for security
        bot_token: '', 
        oauth_client_secret: '',
        auto_post_settings: {
          announcements: settings.auto_post_settings?.announcements || false,
          events: settings.auto_post_settings?.events || false,
          trades: settings.auto_post_settings?.trades || false,
          achievements: settings.auto_post_settings?.achievements || false,
          contracts: settings.auto_post_settings?.contracts || false,
        },
      };
    }
  } catch (error) {
    console.error('Failed to fetch Discord settings:', error);
    alert('Failed to load Discord settings.');
  }
};

const fetchWebhooks = async () => {
  try {
    webhooks.value = await DiscordService.listWebhooks();
  } catch (error) {
    console.error('Failed to fetch webhooks:', error);
    alert('Failed to load webhooks.');
  }
};

const fetchRoleMappings = async () => {
  try {
    // Fetch role mappings and map hub_role_id to hub_role_name for display
    const mappings = await DiscordService.listRoleMappings();
    const hubRoles = await RoleService.getAllRoles(); 
    
    roleMappings.value = mappings.map(mapping => ({
      ...mapping,
      hub_role_name: hubRoles.find(role => role.id === mapping.hub_role_id)?.name || 'Unknown Role'
    }));

  } catch (error) {
    console.error('Failed to fetch role mappings:', error);
    alert('Failed to load role mappings.');
  }
};

const saveSettings = async () => {
  try {
    const payload = { ...settingsForm.value };
    // Only send non-empty secret/token values if they were entered
    if (payload.oauth_client_secret === '') delete payload.oauth_client_secret;
    if (payload.bot_token === '') delete payload.bot_token;

    await DiscordService.saveDiscordSettings(payload);
    alert('Discord settings saved successfully!');
    // Re-fetch to clear password fields
    fetchSettings();
  } catch (error) {
    console.error('Failed to save Discord settings:', error);
    alert('Failed to save Discord settings. Please check your input and try again.');
  }
};

const openEditWebhookModal = (webhook) => {
  editingWebhook.value = { ...webhook };
  showWebhookModal.value = true;
};

const handleDeleteWebhook = async (webhookId) => {
  if (confirm('Are you sure you want to delete this webhook?')) {
    try {
      await DiscordService.deleteWebhook(webhookId);
      alert('Webhook deleted successfully!');
      fetchWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      alert('Failed to delete webhook.');
    }
  }
};

const handleTestWebhook = async (webhookId) => {
  try {
    await DiscordService.testWebhook(webhookId, "This is a test message from Star Citizen Hub!");
    alert('Test message sent successfully!');
  } catch (error) {
    console.error('Failed to send test webhook:', error);
    alert('Failed to send test webhook. Check webhook URL and Discord configuration.');
  }
};

const openEditRoleMappingModal = (mapping) => {
  editingRoleMapping.value = { ...mapping };
  showRoleMappingModal.value = true;
};

const handleDeleteRoleMapping = async (mappingId) => {
  if (confirm('Are you sure you want to delete this role mapping?')) {
    try {
      await DiscordService.deleteRoleMapping(mappingId);
      alert('Role mapping deleted successfully!');
      fetchRoleMappings();
    } catch (error) {
      console.error('Failed to delete role mapping:', error);
      alert('Failed to delete role mapping.');
    }
  }
};

onMounted(async () => {
  await Promise.all([
    fetchSettings(),
    fetchWebhooks(),
    fetchRoleMappings(),
  ]);
  isLoading.value = false;
});
</script>

<style scoped>
/* Scoped styles for AdminDiscordSettingsView */
</style>