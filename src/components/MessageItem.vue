<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { useAuthStore } from "../stores/auth";
import {
  useEditMessage,
  useDeleteMessage,
  type Message,
} from "../api/queries";

const props = defineProps<{ message: Message; conversationId: string }>();

const auth = useAuthStore();
const editMutation = useEditMessage(props.conversationId);
const deleteMutation = useDeleteMessage(props.conversationId);

const isEditing = ref(false);
const draft = ref("");
const showPopover = ref(false);
const bubbleEl = ref<HTMLElement | null>(null);

function openPopover(e: MouseEvent) {
  if (!isMine() || isEditing.value) return;
  e.preventDefault();
  showPopover.value = true;
}

function closePopover() {
  showPopover.value = false;
}

function handleDocClick(e: MouseEvent) {
  if (!bubbleEl.value) return;
  if (!bubbleEl.value.contains(e.target as Node)) closePopover();
}

function handleKey(e: KeyboardEvent) {
  if (e.key === "Escape") closePopover();
}

watch(showPopover, (open) => {
  if (open) {
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("keydown", handleKey);
  } else {
    document.removeEventListener("mousedown", handleDocClick);
    document.removeEventListener("keydown", handleKey);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleDocClick);
  document.removeEventListener("keydown", handleKey);
});

function senderIdOf(msg: Message) {
  return typeof msg.sender === "string" ? msg.sender : msg.sender._id;
}
function senderNameOf(msg: Message) {
  return typeof msg.sender === "string" ? "" : msg.sender.username;
}

const isMine = () => senderIdOf(props.message) === auth.user?.id;

function startEdit() {
  draft.value = props.message.content;
  isEditing.value = true;
  closePopover();
}

function cancelEdit() {
  isEditing.value = false;
  draft.value = "";
}

function saveEdit() {
  const newMessage = draft.value.trim();
  if (!newMessage || newMessage === props.message.content) {
    cancelEdit();
    return;
  }
  editMutation.mutate({ id: props.message._id, newMessage });
  isEditing.value = false;
}

function remove() {
  closePopover();
  if (confirm("Delete this message?")) {
    deleteMutation.mutate(props.message._id);
  }
}
</script>

<template>
  <div class="message" :class="{ mine: isMine() }">
    <div class="bubble" ref="bubbleEl" @contextmenu="openPopover">
      <span v-if="senderNameOf(message)" class="sender">
        {{ senderNameOf(message) }}
      </span>

      <form v-if="isEditing" class="edit-form" @submit.prevent="saveEdit">
        <input v-model="draft" autofocus @keyup.escape="cancelEdit" />
        <div class="edit-actions">
          <button type="button" @click="cancelEdit">Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>

      <template v-else>
        <p>
          {{ message.content }}
          <span v-if="message.isEdited" class="edited">(edited)</span>
        </p>

        <div v-if="isMine() && showPopover" class="popover" role="menu">
          <button type="button" @click="startEdit">Edit</button>
          <button type="button" @click="remove">Delete</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.message {
  display: flex;
}

.message.mine {
  justify-content: flex-end;
}

.bubble {
  max-width: 65%;
  padding: 10px 14px;
  border-radius: 14px;
  background: var(--code-bg);
  color: var(--text-h);
  position: relative;
}

.message.mine .bubble {
  background: var(--accent);
  color: white;
}

.sender {
  display: block;
  font-size: 12px;
  opacity: 0.7;
  margin-bottom: 2px;
}

.bubble p {
  margin: 0;
  font-size: 15px;
  white-space: pre-wrap;
  word-break: break-word;
}

.edited {
  font-size: 11px;
  opacity: 0.6;
  margin-left: 4px;
}

.bubble {
  user-select: none;
}

.popover {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  min-width: 110px;
  background: var(--bg, #1f1f22);
  color: var(--text-h);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  padding: 4px;
  z-index: 10;
}

.message:not(.mine) .popover {
  right: auto;
  left: 0;
}

.popover button {
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  font-size: 13px;
  text-align: left;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.popover button:hover {
  background: rgba(127, 127, 127, 0.18);
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.edit-form input {
  padding: 6px 8px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.15);
  color: inherit;
  font: inherit;
  font-size: 15px;
}

.edit-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.edit-actions button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: inherit;
  font: inherit;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
