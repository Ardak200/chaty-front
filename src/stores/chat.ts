import { defineStore } from "pinia";
import { ref } from "process";
import { http } from "../api/http";

interface Participant {
  _id: string;
  username: string;
  email: string;
}

export interface Conversation {
  _id: string;
  type: "direct" | "group";
  name?: string;
  participants: Participant[];
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: string | { _id: string; username: string };
  content: string;
  read: boolean;
  isEdited: boolean;
  createdAt: string;
}

export const useChatStore = defineStore("chat", () => {
  const conversations = ref<Conversation[]>([]);
  const messages = ref<Message[]>([]);
  const activeConversationId = ref<string | null>(null);
  const loadingConversations = ref(false);
  const loadingMessages = ref(false);

  async function fetchConversations() {
    loadingConversations.value = true;
    try {
      const { data } = await http.get("/conversations");
      conversations.value = data.conversations;
    } finally {
      loadingConversations.value = false;
    }
  }

  async function fetchMessages(conversationId: string, page = 1, limit = 50) {
    loadingMessages.value = true;
    try {
      const { data } = await http.get(
        `/messages/${conversationId}?page=${page}&limit=${limit}`,
      );
      // API returns newest-first, reverse so oldest is on top
      messages.value = data.data.reverse();
    } finally {
      loadingMessages.value = false;
    }
  }
});
