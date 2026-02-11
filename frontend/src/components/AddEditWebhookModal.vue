<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-sc-dark p-6 rounded-lg shadow-lg w-full max-w-md border border-sc-grey/20">
      <h3 class="text-xl font-bold text-white mb-4">{{ isEditMode ? 'Edit Webhook' : 'Create New Webhook' }}</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Name -->
        <div>
          <label for="name" class="block text-sc-grey text-sm font-bold mb-2">Webhook Name <span class="text-red-500">*</span></label>
          <input type="text" id="name" v-model="webhookForm.name"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>

        <!-- Webhook URL -->
        <div>
          <label for="webhook_url" class="block text-sc-grey text-sm font-bold mb-2">Webhook URL <span class="text-red-500">*</span></label>
          <input type="url" id="webhook_url" v-model="webhookForm.webhook_url"
                 class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue" required />
        </div>

        <!-- Event Types -->
        <div>
          <label class="block text-sc-grey text-sm font-bold mb-2">Trigger Events</label>
          <div class="grid grid-cols-2 gap-2">
            <div v-for="eventType in allEventTypes" :key="eventType" class="flex items-center">
              <input type="checkbox" :id="`event_type_${eventType}`" :value="eventType" v-model="webhookForm.event_types" class="mr-2">
              <label :for="`event_type_${eventType}`" class="text-white capitalize">{{ eventType }}</label>
            </div>
          </div>
          <p class="text-xs text-sc-grey/70 mt-1">Select which events should trigger this webhook.</p>
        </div>

        <!-- Message Template -->
        <div>
          <label for="message_template" class="block text-sc-grey text-sm font-bold mb-2">Message Template (Optional)</label>
          <textarea id="message_template" v-model="webhookForm.message_template" rows="3"
                    class="shadow appearance-none border border-sc-grey/30 rounded w-full py-2 px-3 bg-black/30 text-white leading-tight focus:outline-none focus:shadow-outline focus:border-sc-blue"></textarea>
          <p class="text-xs text-sc-grey/70 mt-1">Use placeholders like `{title}`, `{content}`, `{user}`. Leave empty for default messages.</p>
        </div>

        <!-- Is Active (only for edit) -->
        <div v-if="isEditMode">
          <input type="checkbox" id="is_active" v-model="webhookForm.is_active" class="mr-2">
          <label for="is_active" class="text-white">Is Active</label>
        </div>

        <div class="flex justify-end space-x-4 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sc-grey border border-sc-grey/50 hover:bg-sc-grey/20 transition-all rounded">Cancel</button>
          <button type="submit"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-sm font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all rounded">
            {{ isEditMode ? 'Update Webhook' : 'Create Webhook' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, computed } from 'vue';
import DiscordService from '../services/DiscordService';

const props = defineProps({
  show: Boolean,
  webhook: Object // The webhook object to be edited (optional)
});

const emit = defineEmits(['close', 'webhook-saved']);

const allEventTypes = ['announcements', 'events', 'trades', 'achievements', 'contracts'];

const defaultForm = {
  name: '',
  webhook_url: '',
  event_types: [],
  message_template: '',
  is_active: true, // Default to active for new webhooks
};

const webhookForm = ref({ ...defaultForm });

const isEditMode = computed(() => !!props.webhook);

// Watch for changes in the 'webhook' prop to populate the form when in edit mode
watch(() => props.webhook, (newVal) => {
  if (newVal) {
    webhookForm.value = { 
      ...newVal,
      // Ensure event_types is an array for checkboxes
      event_types: newVal.event_types || [],
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
      result = await DiscordService.updateWebhook(props.webhook.id, webhookForm.value);
      alert('Webhook updated successfully!');
    } else {
      result = await DiscordService.createWebhook(webhookForm.value);
      alert('Webhook created successfully!');
    }
    emit('webhook-saved', result);
    emit('close');
    resetForm();
  } catch (error) {
    console.error('Failed to save webhook:', error);
    alert('Failed to save webhook. Please check your input and try again.');
  }
};

const resetForm = () => {
  Object.assign(webhookForm.value, defaultForm);
};
</script>

<style scoped>
/* Specific styles for AddEditWebhookModal */
</style>
