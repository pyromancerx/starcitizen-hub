<template>
  <div v-if="show" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" @click.self="$emit('close')">
    <div class="bg-sc-dark border border-sc-blue/30 rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-bold text-white mb-4">Edit System Setting</h3>
      <form @submit.prevent="submitForm" class="space-y-4">
        <div>
          <label for="setting-key" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Key</label>
          <input 
            id="setting-key"
            v-model="form.key"
            type="text"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none"
            disabled
          />
        </div>
        <div>
          <label for="setting-value" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Value</label>
          <textarea 
            id="setting-value"
            v-model="form.value"
            rows="3"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none resize-y"
          ></textarea>
        </div>
        <div>
          <label for="setting-description" class="block text-xs text-sc-grey uppercase tracking-widest mb-2">Description</label>
          <textarea 
            id="setting-description"
            v-model="form.description"
            rows="2"
            class="w-full px-3 py-2 bg-sc-panel border border-sc-grey/30 rounded-lg text-white focus:border-sc-blue focus:outline-none resize-y"
          ></textarea>
        </div>
        <div class="flex items-center">
          <input 
            id="setting-is-public"
            v-model="form.is_public"
            type="checkbox"
            class="h-4 w-4 text-sc-blue focus:ring-sc-blue border-sc-grey/30 rounded"
          />
          <label for="setting-is-public" class="ml-2 block text-sm text-white">Is Public</label>
        </div>

        <div class="flex gap-3 pt-2">
          <button 
            type="button"
            @click="$emit('close')"
            class="flex-1 px-4 py-2 text-sc-grey hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            :disabled="isLoading"
            class="flex-1 px-4 py-2 bg-sc-blue hover:bg-sc-light-blue disabled:opacity-50 disabled:cursor-not-allowed text-sc-dark rounded font-bold uppercase tracking-widest text-sm transition-colors"
          >
            {{ isLoading ? 'Updating...' : 'Update Setting' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';
import { useSystemStore } from '../stores/system';

const props = defineProps({
  show: Boolean,
  setting: Object, // The setting object to edit
});

const emit = defineEmits(['close', 'setting-updated']);

const systemStore = useSystemStore();
const isLoading = ref(false);

const form = ref({
  key: '',
  value: '',
  description: '',
  is_public: false,
});

// Watch for changes in the setting prop to populate the form
watch(() => props.setting, (newVal) => {
  if (newVal) {
    form.value.key = newVal.key;
    form.value.value = newVal.value;
    form.value.description = newVal.description;
    form.value.is_public = newVal.is_public;
  }
}, { immediate: true });

const submitForm = async () => {
  isLoading.value = true;
  try {
    const updatedData = {
      value: form.value.value,
      description: form.value.description || null,
      is_public: form.value.is_public,
    };
    await systemStore.updateSetting(props.setting.key, updatedData);
    emit('setting-updated');
    emit('close');
  } catch (error) {
    alert(error.message || 'Failed to update system setting.');
  } finally {
    isLoading.value = false;
  }
};
</script>