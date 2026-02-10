<template>
  <div class="relative">
    <!-- Bell Button -->
    <button 
      @click="toggleDropdown"
      class="relative p-2 text-sc-grey hover:text-white transition-colors"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
      </svg>
      
      <!-- Unread Badge -->
      <span 
        v-if="notificationStore.unreadCount > 0"
        class="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center"
      >
        {{ notificationStore.unreadCount > 9 ? '9+' : notificationStore.unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <div 
      v-if="showDropdown"
      v-click-outside="closeDropdown"
      class="absolute right-0 mt-2 w-96 bg-sc-panel border border-sc-grey/20 rounded-lg shadow-2xl z-50"
    >
      <!-- Header -->
      <div class="flex justify-between items-center p-4 border-b border-sc-grey/10">
        <h3 class="text-sm font-bold text-white uppercase tracking-widest">Notifications</h3>
        <div class="flex gap-2">
          <button 
            v-if="notificationStore.unreadCount > 0"
            @click="markAllAsRead"
            class="text-xs text-sc-blue hover:text-white transition-colors"
          >
            Mark all read
          </button>
          <router-link 
            to="/notifications"
            @click="closeDropdown"
            class="text-xs text-sc-grey hover:text-white transition-colors"
          >
            View All
          </router-link>
        </div>
      </div>

      <!-- Notification List -->
      <div class="max-h-96 overflow-y-auto">
        <div v-if="notificationStore.isLoading && notificationStore.notifications.length === 0" class="flex justify-center p-8">
          <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-sc-blue"></div>
        </div>

        <div v-else-if="notificationStore.notifications.length === 0" class="p-8 text-center">
          <p class="text-sc-grey text-sm">No notifications</p>
        </div>

        <div v-else>
          <div 
            v-for="notification in recentNotifications" 
            :key="notification.id"
            @click="handleNotificationClick(notification)"
            :class="[
              'p-3 border-b border-sc-grey/10 cursor-pointer hover:bg-sc-blue/5 transition-colors',
              !notification.is_read ? 'bg-sc-blue/5' : ''
            ]"
          >
            <div class="flex gap-3">
              <!-- Icon -->
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-sc-blue/10 flex items-center justify-center">
                <span class="text-sm">{{ getNotificationIcon(notification.type) }}</span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="text-sm text-white font-medium truncate">
                  {{ notification.title }}
                </div>
                <div class="text-xs text-sc-grey truncate">
                  {{ notification.message }}
                </div>
                <div class="text-[10px] text-sc-grey/50 mt-1">
                  {{ formatTimeAgo(notification.created_at) }}
                </div>
              </div>

              <!-- Unread Indicator -->
              <div v-if="!notification.is_read" class="flex-shrink-0">
                <div class="w-2 h-2 bg-sc-blue rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-3 border-t border-sc-grey/10 text-center">
        <router-link 
          to="/notifications"
          @click="closeDropdown"
          class="text-xs text-sc-blue uppercase tracking-widest hover:text-white transition-colors"
        >
          Open Notification Center
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '../stores/notification';

const router = useRouter();
const notificationStore = useNotificationStore();
const showDropdown = ref(false);

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

const recentNotifications = computed(() => {
  return notificationStore.notifications.slice(0, 5);
});

onMounted(() => {
  notificationStore.fetchUnreadCount();
  notificationStore.fetchNotifications({ limit: 5 });
  notificationStore.startPolling(30000); // Poll every 30 seconds
});

onUnmounted(() => {
  notificationStore.stopPolling();
});

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
  if (showDropdown.value) {
    notificationStore.fetchNotifications({ limit: 5 });
  }
};

const closeDropdown = () => {
  showDropdown.value = false;
};

const markAllAsRead = async () => {
  await notificationStore.markAsRead();
};

const handleNotificationClick = async (notification) => {
  if (!notification.is_read) {
    await notificationStore.markAsRead([notification.id]);
  }
  
  if (notification.link) {
    router.push(notification.link);
  } else {
    router.push('/notifications');
  }
  
  closeDropdown();
};

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

// Click outside directive
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value();
      }
    };
    document.addEventListener('click', el._clickOutside);
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside);
  },
};
</script>
