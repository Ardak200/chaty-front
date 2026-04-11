<script setup lang="ts">
import { ref } from "vue";
import { getSocket } from "../api/socket";

const props = defineProps<{ conversationId: string }>();

const text = ref("");

function handleSend() {
  const content = text.value.trim();
  if (!content) return;

  getSocket()?.emit("sendMessage", {
    conversationId: props.conversationId,
    content,
  });
  text.value = "";
}
</script>

<template>
  <form class="composer" @submit.prevent="handleSend">
    <input v-model="text" placeholder="Type a message..." />
    <button type="submit">Send</button>
  </form>
</template>

<style scoped>
.composer {
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--border);
}

.composer input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text-h);
  font: inherit;
}

.composer button {
  padding: 10px 18px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-weight: 500;
}
</style>
