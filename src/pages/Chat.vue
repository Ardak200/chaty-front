<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "../stores/auth";
import { useChatStore } from "../stores/chat";
import { useConversations } from "../api/queries";
import ConversationsList from "../components/ConversationsList.vue";
import MessageList from "../components/MessageList.vue";
import MessageComposer from "../components/MessageComposer.vue";
import NewConversationDialog from "../components/NewConversationDialog.vue";

const auth = useAuthStore();
const chat = useChatStore();
const { activeConversationId } = storeToRefs(chat);

const { data: conversations } = useConversations();
const showNewConvoDialog = ref(false);

const activeConversation = computed(() =>
  conversations.value?.find((c) => c._id === activeConversationId.value),
);

function conversationTitle() {
  const convo = activeConversation.value;
  if (!convo) return "";
  if (convo.type === "group") return convo.name || "Group chat";
  const other = convo.participants.find((p) => p._id !== auth.user?.id);
  return other?.username || "Direct chat";
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
        </header>

        <MessageList :conversation-id="activeConversationId" />
        <MessageComposer :conversation-id="activeConversationId" />
      </template>
    </main>

    <NewConversationDialog
      :open="showNewConvoDialog"
      @close="showNewConvoDialog = false"
    />
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
}

.main-header h3 {
  margin: 0;
  color: var(--text-h);
}

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
}
</style>
