<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useChatStore } from "../stores/chat";
import { useAuthStore } from "../stores/auth";
import { useConversations, type Conversation } from "../api/queries";

const chat = useChatStore();
const auth = useAuthStore();
const { activeConversationId } = storeToRefs(chat);

const { data: conversations, isLoading: loadingConvos } = useConversations();

function conversationTitle(convo: Conversation) {
  if (convo.type === "group") return convo.name || "Group chat";
  const other = convo.participants.find((p) => p._id !== auth.user?.id);
  return other?.username || "Direct chat";
}
</script>

<template>
  <div v-if="loadingConvos">Loading conversations...</div>

  <ul v-else class="convo-list">
    <li
      v-for="convo in conversations"
      :key="convo._id"
      :class="{ active: convo._id === activeConversationId }"
      @click="chat.selectConversation(convo._id)"
    >
      {{ conversationTitle(convo) }}
    </li>
  </ul>
</template>

<style scoped>
.muted {
  color: var(--text);
  font-size: 14px;
}

.convo-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.convo-list li {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-h);
  font-size: 15px;
}

.convo-list li:hover {
  background: var(--accent-bg);
}

.convo-list li.active {
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
}
</style>
