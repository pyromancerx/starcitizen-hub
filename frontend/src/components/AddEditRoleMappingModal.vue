<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-sc-dark p-6 rounded-lg shadow-lg w-full max-w-md border border-sc-grey/20">
      <h3 class="text-xl font-bold text-white mb-4">{{ isEditMode ? 'Edit Role Mapping' : 'Create New Role Mapping' }}</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Hub Role -->
        <div>
          <label for="hub_role" class="block text-sc-grey text-sm font-bold mb-2">Hub Role <span class="text-red-500">*</span></label>
          <select id="hub_role" v-model="mappingForm.hub_role_id"
                  class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required>
            <option :value="null" disabled>Select a Hub Role</option>
            <option v-for="role in hubRoles" :key="role.id" :value="role.id">{{ role.name }}</option>
          </select>
        </div>

        <!-- Discord Role ID -->
        <div>
          <label for="discord_role_id" class="block text-sc-grey text-sm font-bold mb-2">Discord Role ID <span class="text-red-500">*</span></label>
          <input type="text" id="discord_role_id" v-model="mappingForm.discord_role_id"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
          <p class="text-xs text-sc-grey/70 mt-1">The ID of the Discord role (right-click on role in Discord and 'Copy ID').</p>
        </div>

        <!-- Discord Role Name -->
        <div>
          <label for="discord_role_name" class="block text-sc-grey text-sm font-bold mb-2">Discord Role Name <span class="text-red-500">*</span></label>
          <input type="text" id="discord_role_name" v-model="mappingForm.discord_role_name"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
          <p class="text-xs text-sc-grey/70 mt-1">The name of the Discord role (for display purposes).</p>
        </div>

        <!-- Sync Direction -->
        <div>
          <label for="sync_direction" class="block text-sc-grey text-sm font-bold mb-2">Sync Direction <span class="text-red-500">*</span></label>
          <select id="sync_direction" v-model="mappingForm.sync_direction"
                  class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required>
            <option value="hub_to_discord">Hub to Discord</option>
            <option value="discord_to_hub">Discord to Hub</option>
            <option value="two_way">Two Way</option>
          </select>
          <p class="text-xs text-sc-grey/70 mt-1">Determines how roles are synced between the Hub and Discord.</p>
        </div>

        <!-- Is Active (only for edit) -->
        <div v-if="isEditMode">
          <input type="checkbox" id="is_active" v-model="mappingForm.is_active" class="mr-2">
          <label for="is_active" class="text-white">Is Active</label>
        </div>

        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            {{ isEditMode ? 'Update Mapping' : 'Create Mapping' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, computed, onMounted } from 'vue';
import DiscordService from '../services/DiscordService';
import RoleService from '../services/RoleService'; // Assuming you have this service

const props = defineProps({
  show: Boolean,
  roleMapping: Object // The role mapping object to be edited (optional)
});

const emit = defineEmits(['close', 'role-mapping-saved']);

const hubRoles = ref([]);
const defaultForm = {
  hub_role_id: null,
  discord_role_id: '',
  discord_role_name: '',
  sync_direction: 'hub_to_discord',
  is_active: true, // Default to active for new mappings
};

const mappingForm = ref({ ...defaultForm });

const isEditMode = computed(() => !!props.roleMapping);

// Fetch hub roles on component mount
onMounted(async () => {
  try {
    hubRoles.value = await RoleService.getAllRoles();
  } catch (error) {
    console.error('Failed to fetch hub roles:', error);
    alert('Failed to load Hub roles. Cannot create role mappings.');
  }
});

// Watch for changes in the 'roleMapping' prop to populate the form when in edit mode
watch(() => props.roleMapping, (newVal) => {
  if (newVal) {
    mappingForm.value = { 
      ...newVal,
    };
  } else {
    resetForm();
  }
}, { immediate: true }); // Run handler on initial render

// Watch for 'show' prop to reset form when modal is opened for creation
watch(() => props.show, (newVal) => {
  if (newVal && !isEditMode.value) {
    resetForm();
  }
});

const handleSubmit = async () => {
  try {
    let result;
    if (isEditMode.value) {
      result = await DiscordService.updateRoleMapping(props.roleMapping.id, mappingForm.value);
      alert('Role mapping updated successfully!');
    } else {
      result = await DiscordService.createRoleMapping(mappingForm.value);
      alert('Role mapping created successfully!');
    }
    emit('role-mapping-saved', result);
    emit('close');
    resetForm();
  } catch (error) {
    console.error('Failed to save role mapping:', error);
    alert('Failed to save role mapping. Please check your input and try again.');
  }
};

const resetForm = () => {
  Object.assign(mappingForm.value, defaultForm);
};
</script>

<style scoped>
/* Specific styles for AddEditRoleMappingModal */
</style>
