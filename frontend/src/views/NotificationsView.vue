<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Notification Center</h2>
      <div class="flex gap-3">
        <button 
          v-if="notificationStore.unreadCount > 0"
          @click="markAllAsRead"
          class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all"
        >
          Mark All as Read
        </button>
        <button 
          @click="showPreferences = true"
          class="px-4 py-2 border border-sc-grey/30 text-sc-grey text-xs font-bold uppercase tracking-widest hover:text-white hover:border-sc-grey transition-all"
        >
          Preferences
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-sc-grey/20">
      <button 
        @click="activeTab = 'all'" 
        :class="activeTab === 'all' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey'"
        class="px-6 py-3 border-b-2 text-xs uppercase tracking-widest font-bold transition-colors"
      >
        All Notifications
      </button>
      <button 
        @click="activeTab = 'unread'" 
        :class="activeTab === 'unread' ? 'border-sc-blue text-sc-blue' : 'border-transparent text-sc-grey'"
        class="px-6 py-3 border-b-2 text-xs uppercase tracking-widest font-bold transition-colors"
      >
        Unread
        <span v-if="notificationStore.unreadCount > 0" class="ml-2 bg-sc-blue text-black text-[10px] px-1.5 py-0.5 rounded-full">
          {{ notificationStore.unreadCount }}
        </span>
      </button>
    </div>

    <!-- Notifications List -->
    <div v-if="notificationStore.isLoading && notificationStore.notifications.length === 0" class="flex justify-center p-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sc-blue"></div>
    </div>

    <div v-else-if="filteredNotifications.length === 0" class="bg-sc-panel border border-sc-grey/10 p-12 text-center">
      <p class="text-sc-grey uppercase tracking-widest">
        {{ activeTab === 'unread' ? 'No unread notifications' : 'No notifications' }}
      </p>
    </div>

    <div v-else class="space-y-2">
      <div 
        v-for="notification in filteredNotifications" 
        :key="notification.id"
        :class="[
          'bg-sc-panel border rounded-lg p-4 transition-all',
          !notification.is_read ? 'border-sc-blue/30 bg-sc-blue/5' : 'border-sc-grey/10'
        ]"
      >
        <div class="flex gap-4">
          <!-- Icon -->
          <div class="flex-shrink-0 w-10 h-10 rounded-full bg-sc-blue/10 flex items-center justify-center">
            <span class="text-lg">{{ getNotificationIcon(notification.type) }}</span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start">
              <div>
                <div class="text-base font-bold text-white">
                  {{ notification.title }}
                </div>
                <div class="text-sm text-sc-grey mt-1">
                  {{ notification.message }}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-sc-grey/50">{{ formatTimeAgo(notification.created_at) }}</span>
                <button 
                  @click="deleteNotification(notification.id)"
                  class="text-sc-grey/30 hover:text-red-500 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 mt-3">
              <button 
                v-if="!notification.is_read"
                @click="markAsRead(notification.id)"
                class="text-xs text-sc-blue hover:text-white transition-colors"
              >
                Mark as read
              </button>
              <router-link 
                v-if="notification.link"
                :to="notification.link"
                class="text-xs text-sc-grey hover:text-white transition-colors"
              >
                View details
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Load More -->
      <div v-if="notificationStore.hasMore" class="text-center pt-4">
        <button 
          @click="loadMore"
          :disabled="notificationStore.isLoading"
          class="text-xs text-sc-blue uppercase tracking-widest hover:text-white transition-colors disabled:opacity-50"
        >
          {{ notificationStore.isLoading ? 'Loading...' : 'Load More' }}
        </button>
      </div>
    </div>

    <!-- Preferences Modal -->
    <div v-if="showPreferences" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="showPreferences = false">
      <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 w-full max-w-md shadow-2xl">
        <h3 class="text-xl font-bold text-white uppercase tracking-widest mb-4">Notification Preferences</h3>
        
        <div v-if="!notificationStore.preferences" class="text-center py-4">
          <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-sc-blue mx-auto"></div>
        </div>

        <div v-else class="space-y-4">
          <!-- Global Toggle -->
          <div class="flex items-center justify-between p-3 bg-black/30 rounded">
            <span class="text-white font-medium">Enable Notifications</span>
            <button 
              @click="toggleGlobalNotifications"
              :class="[
                'w-12 h-6 rounded-full transition-colors relative',
                notificationStore.preferences.notifications_enabled ? 'bg-sc-blue' : 'bg-sc-grey/30'
              ]"
            >
              <div :class="[
                'w-4 h-4 rounded-full bg-white absolute top-1 transition-transform',
                notificationStore.preferences.notifications_enabled ? 'left-7' : 'left-1'
              ]"></div>
            </button>
          </div>

          <!-- Type Toggles -->
          <div class="space-y-2">
            <div class="text-xs text-sc-grey uppercase tracking-widest mb-2">Notification Types</div>
            <div 
              v-for="type in notificationTypes" 
              :key="type.value"
              class="flex items-center justify-between p-2 hover:bg-white/5 rounded"
            >
              <span class="text-sm text-white">{{ type.label }}</span>
              <button 
                @click="toggleNotificationType(type.value)"
                :disabled="!notificationStore.preferences.notifications_enabled"
                :class="[
                  'w-10 h-5 rounded-full transition-colors relative disabled:opacity-50',
                  isTypeEnabled(type.value) ? 'bg-sc-blue' : 'bg-sc-grey/30'
                ]"
              >
                <div :class="[
                  'w-3 h-3 rounded-full bg-white absolute top-1 transition-transform',
                  isTypeEnabled(type.value) ? 'left-6' : 'left-1'
                ]"></div>
              </button>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button 
            @click="showPreferences = false"
            class="flex-1 py-2 border border-sc-grey/30 text-sc-grey hover:text-white hover:border-sc-grey transition-all text-xs uppercase tracking-widest"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNotificationStore } from '../stores/notification';

const notificationStore = useNotificationStore();
const activeTab = ref('all');
const showPreferences = ref(false);
const currentOffset = ref(0);

const notificationTypes = [
  { value: 'mention', label: 'Mentions' },
  { value: 'op_invite', label: 'Operation Invites' },
  { value: 'op_reminder', label: 'Operation Reminders' },
  { value: 'contract_accepted', label: 'Contract Updates' },
  { value: 'lfg_response', label: 'LFG Responses' },
  { value: 'achievement_unlocked', label: 'Achievements' },
  { value: 'approval_required', label: 'Approval Requests' },
  { value: 'system_announcement', label: 'System Announcements' },
];

const notificationIcons = {
  mention: '@',
  message_received: '💬',
  op_invite: '🎯',
  op_reminder: '⏰',
  op_cancelled: '❌',
  op_starting_soon: '🚀',
  approval_required: '👤',
  user_approved: '✅',
  user_rejected: '❌',
  contract_accepted: '📋',
  contract_completed: '🤝',
  contract_cancelled: '🚫',
  contract_disputed: '⚠️',
  lfg_response: '👥',
  crew_loadout_assigned: '⚓',
  achievement_unlocked: '🏆',
  system_announcement: '📢',
};

const filteredNotifications = computed(() => {
  if (activeTab.value === 'unread') {
    return notificationStore.notifications.filter(n => !n.is_read);
  }
  return notificationStore.notifications;
});

onMounted(() => {
  notificationStore.fetchNotifications({ limit: 20 });
  notificationStore.fetchPreferences();
});

const getNotificationIcon = (type) => {
  return notificationIcons[type] || '🔔';
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const markAsRead = async (id) => {
  await notificationStore.markAsRead([id]);
};

const markAllAsRead = async () => {
  await notificationStore.markAsRead();
};

const deleteNotification = async (id) => {
  if (confirm('Delete this notification?')) {
    await notificationStore.deleteNotification(id);
  }
};

const loadMore = () => {
  currentOffset.value += 20;
  notificationStore.fetchNotifications({ 
    limit: 20, 
    offset: currentOffset.value,
    unread_only: activeTab.value === 'unread'
  });
};

const isTypeEnabled = (type) => {
  if (!notificationStore.preferences) return true;
  const disabled = notificationStore.preferences.disabled_types || [];
  return !disabled.includes(type);
};

const toggleGlobalNotifications = async () => {
  const newValue = !notificationStore.preferences.notifications_enabled;
  await notificationStore.updatePreferences({ notifications_enabled: newValue });
};

const toggleNotificationType = async (type) => {
  if (isTypeEnabled(type)) {
    await notificationStore.disableNotificationType(type);
  } else {
    await notificationStore.enableNotificationType(type);
  }
};
</script>
