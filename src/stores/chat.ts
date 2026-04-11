import { defineStore } from "pinia";
import { ref } from "vue";

export const useChatStore = defineStore("chat", () => {
  const activeConversationId = ref<string | null>(null);

  function selectConversation(id: string) {
    activeConversationId.value = id;
  }

  return { activeConversationId, selectConversation };
});
