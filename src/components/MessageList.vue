<script setup lang="ts">
import {
  nextTick,
  onMounted,
  onUnmounted,
  useTemplateRef,
  watch,
  toRef,
} from "vue";
import { useMessages, type Message } from "../api/queries";
import { useQueryClient } from "@tanstack/vue-query";
import { getSocket } from "../api/socket";
import MessageItem from "./MessageItem.vue";

const props = defineProps<{ conversationId: string | null }>();

const queryClient = useQueryClient();

const conversationIdRef = toRef(props, "conversationId");
const { data: messages, isLoading } = useMessages(conversationIdRef);

const messagesEl = useTemplateRef<HTMLDivElement>("messagesEl");

// Scroll to bottom on new messages
watch(messages, async () => {
  await nextTick();
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  }
});

// Join the room when the conversation changes
watch(
  () => props.conversationId,
  (id) => {
    if (id) getSocket()?.emit("joinConversation", id);
  },
  { immediate: true },
);

// Push socket messages into the query cache
function handleNewMessage(message: Message) {
  queryClient.setQueryData<Message[]>(
    ["messages", message.conversationId],
    (old) => (old ? [...old, message] : [message]),
  );
}

onMounted(() => {
  getSocket()?.on("newMessage", handleNewMessage);
});

onUnmounted(() => {
  getSocket()?.off("newMessage", handleNewMessage);
});
</script>

<template>
  <div class="messages" ref="messagesEl">
    <div v-if="isLoading" class="muted">Loading messages...</div>

    <MessageItem
      v-for="msg in messages"
      :key="msg._id"
      :message="msg"
      :conversation-id="conversationId!"
    />
  </div>
</template>

<style scoped>
.muted {
  color: var(--text);
  font-size: 14px;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
