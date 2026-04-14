<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "../stores/auth";
import { useChatStore } from "../stores/chat";
import { useConversations } from "../api/queries";
import { useWebRTC } from "../composables/useWebRTC";
import ConversationsList from "../components/ConversationsList.vue";
import MessageList from "../components/MessageList.vue";
import MessageComposer from "../components/MessageComposer.vue";
import NewConversationDialog from "../components/NewConversationDialog.vue";
import VideoCall from "../components/VideoCall.vue";

const auth = useAuthStore();
const chat = useChatStore();
const { activeConversationId } = storeToRefs(chat);

const { data: conversations } = useConversations();
const showNewConvoDialog = ref(false);

const { startCall, status: callStatus } = useWebRTC();

const activeConversation = computed(() =>
  conversations.value?.find((c) => c._id === activeConversationId.value),
);

const otherParticipant = computed(() => {
  const convo = activeConversation.value;
  if (!convo || convo.type !== "direct") return null;
  return convo.participants.find((p) => p._id !== auth.user?.id) || null;
});

function conversationTitle() {
  const convo = activeConversation.value;
  if (!convo) return "";
  if (convo.type === "group") return convo.name || "Group chat";
  return otherParticipant.value?.username || "Direct chat";
}

function handleCallClick() {
  if (otherParticipant.value) {
    startCall(otherParticipant.value._id);
  }
}
</script>

<template>
  <div class="chat-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Chaty</h2>
        <div class="sidebar-actions">
          <button class="btn" @click="showNewConvoDialog = true">+ New</button>
          <button class="btn" @click="auth.logout">Logout</button>
        </div>
      </div>

      <p class="me" v-if="auth.user">
        Signed in as <strong>{{ auth.user.username }}</strong>
      </p>

      <ConversationsList />
    </aside>

    <main class="main">
      <div v-if="!activeConversationId" class="empty">
        Select a conversation to start chatting
      </div>

      <template v-else>
        <header class="main-header">
          <h3>{{ conversationTitle() }}</h3>
          <button
            v-if="otherParticipant"
            class="call-btn"
            :disabled="callStatus !== 'idle'"
            @click="handleCallClick"
          >
            📞 Call
          </button>
        </header>

        <MessageList :conversation-id="activeConversationId" />
        <MessageComposer :conversation-id="activeConversationId" />
      </template>
    </main>

    <NewConversationDialog
      :open="showNewConvoDialog"
      @close="showNewConvoDialog = false"
    />

    <VideoCall />
  </div>
</template>

<style scoped>
.chat-layout {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 280px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 12px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h2 {
  margin: 0;
}

.sidebar-actions {
  display: flex;
  gap: 6px;
}

.btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.me {
  font-size: 13px;
  color: var(--text);
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.main-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.main-header h3 {
  margin: 0;
  color: var(--text-h);
}

.call-btn {
  padding: 8px 14px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
}

.call-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
}
</style>
