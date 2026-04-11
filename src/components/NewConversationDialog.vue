<script setup lang="ts">
import { ref, watch } from "vue";
import { useAuthStore } from "../stores/auth";
import { useCreateDirectConversation, useUsers } from "../api/queries";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();

const auth = useAuthStore();
const search = ref("");
const { data: users, isLoading } = useUsers(search);
const createConvo = useCreateDirectConversation();

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) search.value = "";
  },
);

async function startChat(userId: string) {
  try {
    await createConvo.mutateAsync(userId);
    emit("close");
  } catch (err: any) {
    alert(err.response?.data?.error || "Failed to create conversation");
  }
}
</script>

<template>
  <div v-if="open" class="backdrop" @click.self="emit('close')">
    <div class="dialog">
      <header>
        <h3>New conversation</h3>
        <button class="close" @click="emit('close')">×</button>
      </header>

      <input
        v-model="search"
        placeholder="Search users by username..."
        autofocus
      />

      <div class="results">
        <p v-if="!search" class="muted">Type to search users</p>
        <p v-else-if="isLoading" class="muted">Searching...</p>
        <p v-else-if="!users.length">No users found</p>

        <ul v-else>
          <li v-for="user in users" :key="user._id">
            <span>{{ user.username }}</span>
            <button
              @click="startChat(user._id)"
              :disabled="user._id === auth.user?.id"
            >
              {{ user._id === auth.user?.id ? "You" : "Chat" }}
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

header h3 {
  margin: 0;
  color: var(--text-h);
}

.close {
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text);
  line-height: 1;
}

input {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--text-h);
  font: inherit;
}

.results {
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
}

.muted {
  color: var(--text);
  text-align: center;
  padding: 20px 0;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
}

li:hover {
  background: var(--accent-bg);
}

li button {
  padding: 6px 14px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

li button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
