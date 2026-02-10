<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-white tracking-wide uppercase italic">Messages</h2>
      <button 
        @click="showCompose = true"
        class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue text-xs font-bold uppercase tracking-widest hover:bg-sc-blue/20 transition-all"
      >
        New Message
      </button>
    </div>

    <div class="bg-sc-panel border border-sc-grey/10 rounded-lg overflow-hidden" style="height: 600px;">
      <div class="flex h-full">
        <!-- Conversations List -->
        <div class="w-80 border-r border-sc-grey/10 flex flex-col">
          <div class="p-4 border-b border-sc-grey/10">
            <h3 class="text-sm font-bold text-white uppercase tracking-widest">Conversations</h3>
          </div>
          
          <div v-if="messageStore.isLoading && messageStore.conversations.length === 0" class="flex-1 flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sc-blue"></div>
          </div>

          <div v-else-if="messageStore.conversations.length === 0" class="flex-1 flex items-center justify-center p-4 text-center">
            <p class="text-sc-grey text-sm">No conversations yet</p>
          </div>

          <div v-else class="flex-1 overflow-y-auto">
            <div 
              v-for="conv in messageStore.conversations" 
              :key="conv.id"
              @click="openConversation(conv.id)"
              :class="[
                'p-4 border-b border-sc-grey/10 cursor-pointer hover:bg-sc-blue/5 transition-colors',
                currentConversationId === conv.id ? 'bg-sc-blue/10 border-sc-blue/30' : '',
                conv.unread_count > 0 ? 'bg-sc-blue/5' : ''
              ]"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-sc-blue/20 flex items-center justify-center text-sc-blue font-bold">
                  {{ conv.other_user_name?.[0] || '?' }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-white truncate">{{ conv.other_user_name }}</span>
                    <span class="text-xs text-sc-grey/50">{{ formatTime(conv.last_message_at) }}</span>
                  </div>
                  <div class="flex items-center justify-between mt-1">
                    <span class="text-sm text-sc-grey truncate">{{ conv.last_message_preview }}</span>
                    <span v-if="conv.unread_count > 0" class="bg-sc-blue text-black text-xs font-bold px-2 py-0.5 rounded-full">
                      {{ conv.unread_count }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Message Thread -->
        <div class="flex-1 flex flex-col">
          <div v-if="!currentConversationId" class="flex-1 flex items-center justify-center">
            <p class="text-sc-grey">Select a conversation to view messages</p>
          </div>

          <template v-else>
            <!-- Header -->
            <div class="p-4 border-b border-sc-grey/10 flex justify-between items-center">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-sc-blue/20 flex items-center justify-center text-sc-blue font-bold">
                  {{ messageStore.currentConversation?.other_user_name?.[0] || '?' }}
                </div>
                <span class="font-bold text-white">{{ messageStore.currentConversation?.other_user_name }}</span>
              </div>
              <button 
                @click="deleteConversation"
                class="text-sc-grey hover:text-red-500 transition-colors text-sm"
              >
                Delete
              </button>
            </div>

            <!-- Messages -->
            <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
              <div v-if="messageStore.isLoading" class="flex justify-center">
                <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-sc-blue"></div>
              </div>

              <div 
                v-for="msg in messageStore.messages" 
                :key="msg.id"
                :class="[
                  'flex',
                  msg.is_me ? 'justify-end' : 'justify-start'
                ]"
              >
                <div :class="[
                  'max-w-[70%] px-4 py-2 rounded-lg',
                  msg.is_me 
                    ? 'bg-sc-blue/20 border border-sc-blue/30 text-white' 
                    : 'bg-sc-grey/10 border border-sc-grey/30 text-white'
                ]">
                  <p>{{ msg.content }}</p>
                  <div class="text-xs mt-1 opacity-50 flex items-center gap-2">
                    <span>{{ formatTime(msg.created_at) }}</span>
                    <span v-if="msg.is_me && msg.is_read">✓ Read</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Input -->
            <div class="p-4 border-t border-sc-grey/10">
              <form @submit.prevent="sendMessage" class="flex gap-2">
                <input 
                  v-model="newMessage"
                  type="text" 
                  placeholder="Type a message..."
                  class="flex-1 bg-black/30 border border-sc-grey/30 rounded px-4 py-2 text-white focus:border-sc-blue focus:outline-none"
                  :disabled="sending"
                />
                <button 
                  type="submit"
                  :disabled="!newMessage.trim() || sending"
                  class="px-4 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue hover:bg-sc-blue/20 transition-all disabled:opacity-50"
                >
                  {{ sending ? 'Sending...' : 'Send' }}
                </button>
              </form>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Compose Modal -->
    <div v-if="showCompose" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="showCompose = false">
      <div class="bg-sc-panel border border-sc-blue/30 rounded-lg p-6 w-full max-w-md shadow-2xl">
        <h3 class="text-xl font-bold text-white uppercase tracking-widest mb-4">New Message</h3>
        
        <form @submit.prevent="startConversation" class="space-y-4">
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Recipient</label>
            <select v-model="composeForm.recipientId" required
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white focus:border-sc-blue focus:outline-none">
              <option value="">Select recipient...</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.display_name || user.email }}
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-xs text-sc-grey uppercase tracking-widest mb-1">Message</label>
            <textarea v-model="composeForm.content" rows="3" required
              class="w-full bg-black/50 border border-sc-grey/30 rounded px-3 py-2 text-white focus:border-sc-blue focus:outline-none resize-none"
              placeholder="Type your message..."></textarea>
          </div>
          
          <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
          
          <div class="flex gap-3">
            <button type="button" @click="showCompose = false"
              class="flex-1 py-2 border border-sc-grey/30 text-sc-grey hover:text-white hover:border-sc-grey transition-all text-xs uppercase tracking-widest">
              Cancel
            </button>
            <button type="submit" :disabled="sending"
              class="flex-1 py-2 bg-sc-blue/10 border border-sc-blue text-sc-blue hover:bg-sc-blue/20 transition-all text-xs uppercase tracking-widest disabled:opacity-50">
              {{ sending ? 'Sending...' : 'Send' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMessageStore } from '../stores/message';
import api from '../services/api';

const route = useRoute();
const router = useRouter();
const messageStore = useMessageStore();

const currentConversationId = ref(null);
const newMessage = ref('');
const sending = ref(false);
const showCompose = ref(false);
const composeForm = ref({ recipientId: '', content: '' });
const users = ref([]);
const error = ref(null);
const messagesContainer = ref(null);

onMounted(async () => {
  await messageStore.fetchConversations();
  await fetchUsers();
  
  // Check if conversation ID in URL
  if (route.params.id) {
    currentConversationId.value = parseInt(route.params.id);
    await openConversation(currentConversationId.value);
  }
  
  // Start polling
  messageStore.startPolling(10000);
});

onUnmounted(() => {
  messageStore.stopPolling();
});

watch(() => messageStore.messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}, { deep: true });

const fetchUsers = async () => {
  try {
    const response = await api.get('/members/');
    users.value = response.data;
  } catch (err) {
    console.error('Failed to fetch users:', err);
  }
};

const openConversation = async (id) => {
  currentConversationId.value = id;
  await messageStore.fetchConversation(id);
  router.push(`/messages/${id}`);
};

const sendMessage = async () => {
  if (!newMessage.value.trim()) return;
  
  sending.value = true;
  try {
    const otherUserId = messageStore.currentConversation.other_user_id;
    await messageStore.sendMessage(otherUserId, newMessage.value);
    newMessage.value = '';
  } catch (err) {
    console.error('Failed to send message:', err);
  } finally {
    sending.value = false;
  }
};

const startConversation = async () => {
  if (!composeForm.value.recipientId || !composeForm.value.content.trim()) return;
  
  sending.value = true;
  error.value = null;
  
  try {
    await messageStore.sendMessage(
      parseInt(composeForm.value.recipientId),
      composeForm.value.content
    );
    
    showCompose.value = false;
    composeForm.value = { recipientId: '', content: '' };
    
    // Refresh and open the new conversation
    await messageStore.fetchConversations();
    const newConv = messageStore.conversations[0];
    if (newConv) {
      await openConversation(newConv.id);
    }
  } catch (err) {
    error.value = err.response?.data?.detail || 'Failed to send message';
  } finally {
    sending.value = false;
  }
};

const deleteConversation = async () => {
  if (!confirm('Delete this conversation?')) return;
  
  try {
    await messageStore.deleteConversation(currentConversationId.value);
    currentConversationId.value = null;
    router.push('/messages');
  } catch (err) {
    console.error('Failed to delete conversation:', err);
  }
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
};
</script>
